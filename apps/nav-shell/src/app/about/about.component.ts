import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  protected name = 'Software Engineer';
  protected bio =
    'Passionate about building scalable, maintainable software solutions and creating engaging user experiences.';

  protected skills = [
    'Angular',
    'TypeScript',
    'Node.js',
    'Express',
    'RxJS',
    'Nx Monorepo',
    'SCSS',
    'REST APIs',
  ];

  protected experience = [
    {
      title: 'Senior Software Engineer',
      company: 'Your Company',
      duration: '2020 - Present',
      description: 'Led development of full-stack applications and mentored junior developers.',
    },
    {
      title: 'Full Stack Developer',
      company: 'Previous Company',
      duration: '2018 - 2020',
      description: 'Developed and maintained multiple web applications using modern tech stack.',
    },
    {
      title: 'Junior Developer',
      company: 'First Company',
      duration: '2016 - 2018',
      description: 'Started career building web applications and learning best practices.',
    },
  ];
}
