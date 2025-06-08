import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { fetchParticipants, fetchEventDetails, fetchWinners } from './fetch.controllers.js';
import { generateCertificate } from './generate.controllers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const certificateDir = path.join(__dirname, '..', 'certificates');

if (!fs.existsSync(certificateDir)) {
  fs.mkdirSync(certificateDir, { recursive: true });
}

function capitalizeName(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

async function processCertificates(eventId, token) {
  try {
    // Fetch event details
    const eventDetails = await fetchEventDetails(eventId, token);
    const eventName = eventDetails.name;

    // Fetch all participants details
    let participantData = await fetchParticipants(eventId, token);
    if (!Array.isArray(participantData)) {
      participantData = Object.values(participantData);
    }

    // Fetch winners details
    const winnersData = await fetchWinners(eventId, token);
    const winners = winnersData.results || [];

    // Winners mapping
    const winnersMap = winners.reduce((map, winner) => {
      if (winner.teamName?.trim()) {
        map.set(winner.teamName.trim(), { position: winner.position });
      }
      return map;
    }, new Map());

    // Process participants
    const processedParticipants = participantData.map(p => {
      const teamName = p.team.name?.trim();
      const isWinner = winnersMap.has(teamName);
      
      return {
        id: p.excelId,
        name: p.user.name?.trim(),
        gender: p.user.gender?.trim(),
        email: p.user.email?.trim(),
        phone: p.user.mobileNumber?.trim(),
        team: {
          id: p.team.id,
          name: teamName
        },
        isWinner,
        position: isWinner ? winnersMap.get(teamName).position : null,
        isCheckedIn: p.checkedIn
      };
    });

    const eventDirName = eventName.replace(/\s+/g, "_");
    const eventDir = path.join(certificateDir, eventDirName);

    if (!fs.existsSync(eventDir)) {
      fs.mkdirSync(eventDir, { recursive: true });
    }

    const BATCH_SIZE = 50; // Batch size
    const generatedFiles = [];
    let certificateCount = 0;

    // Batch processing
    for (let i = 0; i < processedParticipants.length; i += BATCH_SIZE) {
      const batch = processedParticipants.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(batch.map(async (participant) => {
        participant.name = capitalizeName(participant.name);

        const filename = `${participant.name.replace(/\s+/g, "_")}${participant.isWinner ? '_Winner' : ''}.pdf`;
        const outputPath = path.join(eventDir, filename);

        await generateCertificate(
          participant.isWinner ? participant.team.name : participant.name,
          eventName,
          participant.isWinner ? 1 : 0,
          participant.position,
          outputPath
        );
        
        return {
          id: participant.id,
          name: participant.name,
          gender: participant.gender,
          email: participant.email,
          phone: participant.phone,
          team: {
            id: participant.team.id,
            name: participant.team.name
          },
          isWinner: participant.isWinner,
          position: participant.position
        };
      }));
      
      generatedFiles.push(...batchResults);
      certificateCount += batchResults.length;
    }

    return {
      certificateCount,
      eventName,
      generatedFiles
    };
  } catch (error) {
    throw new Error(`Certificate generation failed: ${error.message}`);
  }
}

export { processCertificates };
