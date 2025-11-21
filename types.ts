import React from 'react';

export enum Screen {
  SPLASH,
  UPLOAD,
  PROCESSING,
  RESULT,
  GALLERY,
}

export enum PoemStyle {
  Soneto = 'Soneto',
  Haiku = 'Haiku',
  VersoLibre = 'Verso Libre',
  Romantico = 'Romántico',
  Minimalista = 'Minimalista',
  Clasico = 'Clásico',
}

export enum PoemMood {
  Nostalgia = 'Nostalgia',
  Celebracion = 'Celebración',
  Reflexion = 'Reflexión',
  Amor = 'Amor',
  Aventura = 'Aventura',
  Serenidad = 'Serenidad',
}

export enum ShareTemplate {
  Story = 'Story',
  Square = 'Square',
  Polaroid = 'Polaroid',
}

export type Language = 'es' | 'en';

export interface SelectionOption {
  id: PoemStyle | PoemMood;
  label: {
    es: string;
    en: string;
  };
  icon: React.ReactElement<React.SVGProps<SVGSVGElement>>;
  color: string;
  colorLight: string;
}

export interface Poem {
  title: string;
  poem: string;
}