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

async function processCertificates(eventId, cType, token) {
  try {
    const eventDetails = await fetchEventDetails(eventId, token);
    const eventName = eventDetails.name;

    let participants = [];

    if (cType === 1) { // Winners
      const winnersData = await fetchWinners(eventId, token);

      let winners = winnersData.results;

      participants = winners.map(winner => ({
        name: winner.teamName,
        position: winner.position,
      }));
    } else { // Participants
      let participantData = await fetchParticipants(eventId, token);

      if (!Array.isArray(participantData)) {
        participantData = Object.values(participantData);
      }

      // Note: We also need to check for isWinner and isCheckedIn flags before processing

      participants = participantData.map(p => {
        return {
          name: p.user.name?.trim(),
        };
      });
    }

    const eventDirName = eventName.replace(/\s+/g, "_");
    const eventDir = path.join(certificateDir, eventDirName);

    if (!fs.existsSync(eventDir)) {
      fs.mkdirSync(eventDir, { recursive: true });
    }

    const generatedFiles = [];
    let certificateCount = 0;
    let certificateType = cType === 1 ? 'Appreciation' : 'Participation';

    for (const participant of participants) {
      let appreciationType = cType === 1 ? true : false;

      participant.name = capitalizeName(participant.name);

      const filename = `${participant.name.replace(/\s+/g, "_")}${appreciationType ? '_Winner' : ''}.pdf`;
      const outputPath = path.join(eventDir, filename);

      await generateCertificate(participant.name, eventName, cType, participant.position, outputPath);
      certificateCount++;

      generatedFiles.push({
        name: participant.name,
      });
    }

    return {
      certificateCount,
      eventName,
      certificateType,
      generatedFiles
    };
  } catch (error) {
    throw new Error(`Certificate generation failed: ${error.message}`);
  }
}

export { processCertificates };
