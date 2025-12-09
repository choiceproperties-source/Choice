import sgMail from "@sendgrid/mail";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || "";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from = "noreply@choiceproperties.com",
}: EmailParams) {
  if (!SENDGRID_API_KEY) {
    return { success: true, mock: true };
  }

  try {
    await sgMail.send({
      to,
      from,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// Email templates
export function getAgentInquiryEmailTemplate(data: {
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  message: string;
  propertyTitle?: string;
}) {
  return `
    <h2>New Inquiry from Choice Properties</h2>
    <p><strong>From:</strong> ${data.senderName}</p>
    <p><strong>Email:</strong> ${data.senderEmail}</p>
    <p><strong>Phone:</strong> ${data.senderPhone}</p>
    ${data.propertyTitle ? `<p><strong>Property:</strong> ${data.propertyTitle}</p>` : ""}
    <p><strong>Message:</strong></p>
    <p>${data.message}</p>
    <p>Please reply to ${data.senderEmail} to respond.</p>
  `;
}

export function getApplicationConfirmationEmailTemplate(data: {
  applicantName: string;
  propertyTitle: string;
}) {
  return `
    <h2>Application Received!</h2>
    <p>Hi ${data.applicantName},</p>
    <p>We've received your application for <strong>${data.propertyTitle}</strong>.</p>
    <p>Your application is currently under review. You'll hear from us within 3-5 business days.</p>
    <p>Best regards,<br>Choice Properties Team</p>
  `;
}
