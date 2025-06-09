import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  pool: true,
  host: process.env.SMTP_HOST,
  maxConnections: 5,
  maxMessages: 100,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  socketTimeout: 60000,
  connectionTimeout: 30000
  // debug: true
});

async function verifyConnection() {
  try {
    const verification = await transporter.verify();
    console.log('SMTP server connection successful:', verification);
    return true;
  } catch (error) {
    console.error('SMTP server connection failed:', error);
    return false;
  }
}

async function sendCertificateEmail(recipientEmail, recipientName, eventName, isWinner, position, pdfBuffer) {
  try {
    const certificateType = isWinner ? 'Appreciation' : 'Participation';
    const filename = `Certificate of ${certificateType} — ${recipientName.replace(/\s+/g, "_")}.pdf`;
    
    let subject = `Certificate of ${certificateType} — ${eventName} — Excel '25`;
    
    let text = `Dear ${recipientName},\n\n`;
    
    if (isWinner) {
      const positionText = 
        position === 1 ? 'first place' : 
        position === 2 ? 'second place' : 'third place';
      
      text += `Congratulations on achieving ${positionText} in ${eventName}! `;
      text += `We are pleased to present you with this Certificate of Appreciation for your outstanding performance.\n\n`;
    } else {
      text += `Thank you for participating in ${eventName}. `;
      text += `We are pleased to present you with this Certificate of Participation as recognition of your involvement.\n\n`;
    }
    
    text += `Your contribution and enthusiasm were valuable to the success of this event.\n\n`;
    text += `Best regards,\nExcel Core '25`;
    
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: recipientEmail,
      subject: subject,
      text: text,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    // console.log(`Sending email to ${recipientEmail}...`);
    const result = await transporter.sendMail(mailOptions);
    // console.log(`Email sent to ${recipientEmail}: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`Failed to send email to ${recipientEmail}:`, error);
    throw error;
  }
}

export { sendCertificateEmail, verifyConnection };