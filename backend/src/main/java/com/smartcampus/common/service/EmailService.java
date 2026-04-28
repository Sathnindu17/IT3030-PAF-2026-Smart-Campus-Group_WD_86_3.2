package com.smartcampus.common.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send booking status email (Approved / Rejected)
     */
    public void sendBookingStatusEmail(String toEmail, String subject, String message) {

        if (toEmail == null || toEmail.isBlank()) {
            log.error("Email not sent: recipient email is null or empty");
            return;
        }

        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setFrom(fromEmail);
            mail.setTo(toEmail);
            mail.setSubject(subject);
            mail.setText(message);

            mailSender.send(mail);

            log.info("Email sent successfully to {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
        }
    }
}
