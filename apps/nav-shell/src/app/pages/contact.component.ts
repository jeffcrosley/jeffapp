import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="contact-section">
      <h2>Contact Me</h2>
      <div class="contact-info">
        <p>
          <strong>Email:</strong>
          <a href="mailto:jeffcrosley@gmail.com">jeffcrosley@gmail.com</a>
        </p>
        <p><strong>Phone:</strong> <a href="tel:7185139786">718.513.9786</a></p>
        <p>
          <strong>LinkedIn:</strong>
          <a href="https://linkedin.com/in/jeffcrosley" target="_blank"
            >linkedin.com/in/jeffcrosley</a
          >
        </p>
        <p>
          <strong>GitHub:</strong>
          <a href="https://github.com/jeffcrosley" target="_blank"
            >github.com/jeffcrosley</a
          >
        </p>
      </div>
    </section>
  `,
  styles: [
    `
      .contact-section {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(44, 62, 80, 0.08);
        padding: 2rem;
        max-width: 600px;
        margin: 0 auto;
      }
      .contact-section h2 {
        color: #3498db;
        margin-bottom: 1rem;
        font-size: 2rem;
        font-weight: 700;
      }
      .contact-info p {
        font-size: 1.1rem;
        margin: 0.5rem 0;
      }
      .contact-info a {
        color: #2c3e50;
        text-decoration: underline;
        transition: color 0.2s;
      }
      .contact-info a:hover {
        color: #3498db;
      }
    `,
  ],
})
export class ContactComponent {}
