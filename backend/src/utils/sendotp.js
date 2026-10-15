const { transporter } = require("./sendEmailOtp.js")

const otpEmailHtml = (otp, name = "there", minutes = 5) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0"
               style="max-width:480px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.12);">

          <!-- Header -->
          <tr>
            <td style="background:#0b1b2b;padding:28px 32px;">
              <div style="font-size:22px;font-weight:700;color:#ffffff;">
                📒 KhataBook <span style="color:#10b981;">Wholesale</span>
              </div>
              <div style="font-size:13px;color:#94a3b8;margin-top:4px;">Grocery credit ledger</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 12px;">
              <h2 style="margin:0 0 10px;font-size:22px;color:#0f172a;">Verify your email</h2>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#475569;">
                Hi ${name}, use the code below to finish signing in to your Storeman account.
              </p>
            </td>
          </tr>

          <!-- OTP box -->
          <tr>
            <td align="center" style="padding:20px 32px;">
              <div style="display:inline-block;background:#ecfdf5;border:2px dashed #10b981;border-radius:14px;padding:18px 36px;">
                <span style="font-size:38px;font-weight:800;letter-spacing:12px;color:#047857;font-family:'Courier New',monospace;">
                  ${otp}
                </span>
              </div>
            </td>
          </tr>

          <!-- Expiry -->
          <tr>
            <td align="center" style="padding:0 32px 8px;">
              <p style="margin:0;font-size:14px;color:#64748b;">
                ⏱ This code expires in <strong style="color:#0f172a;">${minutes} minutes</strong>.
              </p>
            </td>
          </tr>

          <!-- Warning -->
          <tr>
            <td style="padding:20px 32px 32px;">
              <div style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:8px;padding:12px 16px;font-size:13px;line-height:1.5;color:#92400e;">
                <strong>Never share this code</strong> with anyone. KhataBook will never ask for it by phone or chat.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#94a3b8;text-align:center;">
                Didn't request this? You can safely ignore this email.<br />
                © ${new Date().getFullYear()} KhataBook Wholesale
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const sendOtp = async (email,name, otp) => {
    return await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "KhataBook Email Verification",
        text: `Your OTP is ${otp}. It expires in 5 minutes.`,
        html: otpEmailHtml(otp, name, 5),
    })
}

module.exports = { sendOtp }