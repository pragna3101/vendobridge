import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const isDev = process.env.NODE_ENV === 'development' || !process.env.EMAIL_HOST;
      if (isDev) {
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: 'mock_user',
            pass: 'mock_pass',
          },
        });
        logger.info('Email service initialized with Ethereal SMTP mock config');
      } else {
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: Number(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        logger.info(`Email service initialized with Host: ${process.env.EMAIL_HOST}`);
      }
    } catch (error) {
      logger.error('Failed to initialize Email service', error);
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        logger.warn(`Email system offline. Simulated email to: ${to}, subject: ${subject}`);
        return true;
      }
      
      const info = await this.transporter.sendMail({
        from: '"VendorBridge ERP" <noreply@vendorbridge-erp.com>',
        to,
        subject,
        html,
      });

      logger.info(`Email sent: ${info.messageId} to ${to}`);
      return true;
    } catch (error) {
      logger.error(`Error sending email to ${to}`, error);
      return false;
    }
  }
}

export const emailService = new EmailService();
