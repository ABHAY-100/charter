import { fetchParticipants, fetchEventDetails, fetchWinners } from '../services/fetch.service.js';
import { generateCertificateBuffer } from './generate.controller.js';
import { sendCertificateEmail, verifyConnection } from '../services/email.service.js';

function capitalizeName(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

async function processCertificates(eventId, token) {
  try {
    // Verify SMTP connection
    const smtpConnected = await verifyConnection();
    if (!smtpConnected) {
      throw new Error('Failed to connect to SMTP server. Please check your email configuration.');
    }

    // console.log('Starting certificate processing...');
    
    // Fetch event details
    const eventDetails = await fetchEventDetails(eventId, token);
    const eventName = eventDetails.name;
    // console.log(`Processing certificates for event: ${eventName}`);

    // Fetch all participants details
    let participantData = await fetchParticipants(eventId, token);
    if (!Array.isArray(participantData)) {
      participantData = Object.values(participantData);
    }
    // console.log(`Fetched ${participantData.length} participants`);

    // Fetch winners details
    const winnersData = await fetchWinners(eventId, token);
    const winners = winnersData.results || [];
    // console.log(`Fetched ${winners.length} winners`);

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
    
    const BATCH_SIZE = 10; // Batch size for processing
    const emailsSent = [];
    const failedEmails = [];
    let sentCount = 0;

    // Batch processing
    for (let i = 0; i < processedParticipants.length; i += BATCH_SIZE) {
      const batch = processedParticipants.slice(i, i + BATCH_SIZE);
      // console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(processedParticipants.length/BATCH_SIZE)}`);
      
      const batchPromises = batch.map(async (participant) => {
        participant.name = capitalizeName(participant.name);
        
        // Skip if no email is provided
        if (!participant.email) {
          console.log(`Skipping ${participant.name} - no email provided`);
          return {
            id: participant.id,
            name: participant.name,
            status: "skipped",
            error: "No email provided"
          };
        }
        
        try {
          // console.log(`Processing ${participant.name} (${participant.email}) - ${participant.isWinner ? 'Winner' : 'Participant'}`);
          const displayName = participant.isWinner ? participant.team.name : participant.name;
          
          // Generate certificate buffer
          const pdfBuffer = await generateCertificateBuffer(
            displayName,
            eventName,
            participant.isWinner ? 1 : 0,
            participant.position
          );
          
          // Send email with certificate attached
          await sendCertificateEmail(
            participant.email,
            participant.name,
            eventName,
            participant.isWinner,
            participant.position,
            pdfBuffer
          );
          
          // console.log(`Certificate sent successfully to ${participant.email}`);
          
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
            position: participant.position,
            status: "sent",
          };
        } catch (error) {
          console.error(`Failed to send certificate to ${participant.email}:`, error.message);
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
            position: participant.position,
            status: "failed",
            error: error.message
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);

      const successful = batchResults.filter(result => result.status === "sent");
      const failed = batchResults.filter(result => result.status === "failed" || result.status === "skipped");

      emailsSent.push(...successful);
      sentCount += successful.length;
      failedEmails.push(...failed);
      
      console.log(`Batch completed: ${successful.length} sent, ${failed.length} failed`);
      
      // 2s delay before processing the next batch
      if (i + BATCH_SIZE < processedParticipants.length) {
        console.log('Pausing before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return {
      eventName,
      sentCount,
      emailsSent,
      failedCount: failedEmails.length,
      failedEmails
    };
  } catch (error) {
    console.error('Certificate processing failed:', error);
    throw new Error(`Certificate email sending failed: ${error.message}`);
  }
}

export { processCertificates };
