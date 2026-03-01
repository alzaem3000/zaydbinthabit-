import { Resend } from 'resend';

// Default mock key for development if RESEND_API_KEY is not defined
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

/**
 * Notifies the principal when a teacher uploads new evidence
 */
export async function notifyPrincipalOfNewEvidence(
  principalEmail: string,
  teacherName: string,
  indicatorTitle: string,
  evidenceTitle: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] To: ${principalEmail} - Teacher ${teacherName} uploaded new evidence for ${indicatorTitle}`);
    return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: 'Zayd Bin Thabit <onboarding@resend.dev>',
      to: [principalEmail],
      subject: `New Evidence Uploaded by ${teacherName}`,
      html: `
        <h2>New Evidence Needs Review</h2>
        <p>Teacher <strong>${teacherName}</strong> has uploaded new evidence.</p>
        <ul>
          <li><strong>Indicator:</strong> ${indicatorTitle}</li>
          <li><strong>Evidence Title:</strong> ${evidenceTitle}</li>
        </ul>
        <p>Please login to the system to review this evidence.</p>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email to principal:', error);
    return { success: false, error };
  }
}

/**
 * Notifies the teacher of the review result from the principal
 */
export async function notifyTeacherOfReviewResult(
  teacherEmail: string,
  principalName: string,
  indicatorTitle: string,
  status: 'approved' | 'rejected',
  notes?: string
) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] To: ${teacherEmail} - Principal ${principalName} ${status} your evidence for ${indicatorTitle}`);
    return { success: true, mocked: true };
  }

  const statusArabic = status === 'approved' ? 'مقبول' : 'مرفوض';
  const color = status === 'approved' ? '#16a34a' : '#dc2626';

  try {
    const data = await resend.emails.send({
      from: 'Zayd Bin Thabit <onboarding@resend.dev>',
      to: [teacherEmail],
      subject: `Evidence Review Update: ${statusArabic}`,
      html: `
        <h2>Evidence Review Update</h2>
        <p>Your evidence for indicator <strong>${indicatorTitle}</strong> has been reviewed by <strong>${principalName}</strong>.</p>
        <p>Status: <strong style="color: ${color}">${statusArabic}</strong></p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        <p>Please login to the system for more details.</p>
      `,
    });
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send email to teacher:', error);
    return { success: false, error };
  }
}
