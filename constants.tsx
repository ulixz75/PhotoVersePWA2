import React from 'react';
import { PoemStyle, PoemMood, SelectionOption } from './types';
import { Feather, Heart, BookOpen, Wind, Sun, Moon, Sparkles, Mountain, Coffee } from 'lucide-react';

const cardColors = [
  { color: 'bg-card-blue', colorLight: 'bg-blue-100' },
  { color: 'bg-card-green', colorLight: 'bg-green-100' },
  { color: 'bg-card-yellow', colorLight: 'bg-yellow-100' },
  { color: 'bg-card-pink', colorLight: 'bg-pink-100' },
  { color: 'bg-card-purple', colorLight: 'bg-purple-100' },
  { color: 'bg-card-orange', colorLight: 'bg-orange-100' },
];

export const POEM_STYLES: SelectionOption[] = [
  { id: PoemStyle.Soneto, label: { es: 'Soneto', en: 'Sonnet' }, icon: <BookOpen size={24} />, ...cardColors[0] },
  { id: PoemStyle.Haiku, label: { es: 'Haiku', en: 'Haiku' }, icon: <Feather size={24} />, ...cardColors[1] },
  { id: PoemStyle.VersoLibre, label: { es: 'Verso Libre', en: 'Free Verse' }, icon: <Wind size={24} />, ...cardColors[2] },
  { id: PoemStyle.Romantico, label: { es: 'Romántico', en: 'Romantic' }, icon: <Heart size={24} />, ...cardColors[3] },
  { id: PoemStyle.Minimalista, label: { es: 'Minimalista', en: 'Minimalist' }, icon: <Coffee size={24} />, ...cardColors[4] },
  { id: PoemStyle.Clasico, label: { es: 'Clásico', en: 'Classic' }, icon: <Moon size={24} />, ...cardColors[5] },
];

export const POEM_MOODS: SelectionOption[] = [
  { id: PoemMood.Nostalgia, label: { es: 'Nostalgia', en: 'Nostalgia' }, icon: <Moon size={24} />, ...cardColors[4] },
  { id: PoemMood.Celebracion, label: { es: 'Celebración', en: 'Celebration' }, icon: <Sparkles size={24} />, ...cardColors[5] },
  { id: PoemMood.Reflexion, label: { es: 'Reflexión', en: 'Reflection' }, icon: <BookOpen size={24} />, ...cardColors[0] },
  { id: PoemMood.Amor, label: { es: 'Amor', en: 'Love' }, icon: <Heart size={24} />, ...cardColors[3] },
  { id: PoemMood.Aventura, label: { es: 'Aventura', en: 'Adventure' }, icon: <Mountain size={24} />, ...cardColors[1] },
  { id: PoemMood.Serenidad, label: { es: 'Serenidad', en: 'Serenity' }, icon: <Sun size={24} />, ...cardColors[2] },
];

export const GALLERY_EXAMPLES = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    style: PoemStyle.Haiku,
    mood: PoemMood.Serenidad,
    poem: {
      title: "Niebla Matutina",
      poem: "Montañas grises,\nel silencio se extiende,\npaz en el alma."
    },
    author: "AI Poet"
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    style: PoemStyle.VersoLibre,
    mood: PoemMood.Celebracion,
    poem: {
      title: "Luces de Fiesta",
      poem: "Brillos que danzan en la noche,\nrisas compartidas,\nun instante eterno de alegría que nunca termina."
    },
    author: "AI Poet"
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
    style: PoemStyle.Soneto,
    mood: PoemMood.Aventura,
    poem: {
      title: "El Pug Explorador",
      poem: "Pequeño guardián de mirada atenta,\ncamina seguro por el sendero verde,\nbuscando misterios que el bosque pierde,\nen cada rincón que su paso inventa."
    },
    author: "AI Poet"
  }
];