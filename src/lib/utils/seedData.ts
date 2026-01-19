import type { Passage } from '../types/passage';
import type { Test } from '../types/test';
import { TestType } from '../types/test';
import { QuestionType } from '../types/question';
import { createPassage, createTest } from '../api/storage';

/**
 * Seed sample data for testing the application
 * This creates sample passages and tests
 */
export const seedSampleData = () => {
  // Check if data already exists
  const existingPassages = localStorage.getItem('ielts_passages');
  if (existingPassages && JSON.parse(existingPassages).length > 0) {
    console.log('Sample data already exists');
    return;
  }

  console.log('Seeding sample data...');

  // Create sample passage 1
  const passage1: Omit<Passage, 'id' | 'createdAt' | 'updatedAt'> = {
    title: 'The History of the Bicycle',
    content: `The bicycle, one of the most efficient forms of human-powered transportation, has a fascinating history that spans over two centuries. The first verifiable claim for a practically used bicycle belongs to German Baron Karl von Drais. In 1817, he created a two-wheeled vehicle which he called a Laufmaschine, or "running machine." This early version had no pedals and was propelled by pushing the feet against the ground.

The addition of pedals, which would come to define the bicycle as we know it, occurred in the 1860s. Pierre Michaux, a Parisian blacksmith, is often credited with this innovation, though the true inventor remains a subject of debate among historians. Michaux's "velocipede" featured pedals attached directly to the front wheel, creating what was essentially a mechanized version of the running machine.

The late 19th century saw rapid developments in bicycle design. The iconic "penny-farthing" bicycle, with its enormous front wheel and tiny rear wheel, became popular in the 1870s. However, it was dangerous and difficult to ride. The "safety bicycle," introduced in the 1880s, featured equal-sized wheels and a chain drive, making it much more practical and accessible to the general public. This design formed the basis for modern bicycles.

Today, bicycles are used worldwide for transportation, recreation, and sport. They represent an environmentally friendly alternative to motor vehicles and continue to evolve with new materials and technologies.`,
    questionGroups: [
      {
        id: crypto.randomUUID(),
        type: QuestionType.MULTIPLE_CHOICE,
        instructions: 'Choose the correct letter, A, B, C or D.',
        startNumber: 1,
        endNumber: 3,
        questions: [
          {
            id: crypto.randomUUID(),
            type: QuestionType.MULTIPLE_CHOICE,
            questionNumber: 1,
            text: 'Who created the first verifiable bicycle?',
            options: ['Pierre Michaux', 'Baron Karl von Drais', 'An unknown German inventor', 'A Parisian blacksmith'],
            answer: 'Baron Karl von Drais'
          },
          {
            id: crypto.randomUUID(),
            type: QuestionType.MULTIPLE_CHOICE,
            questionNumber: 2,
            text: 'What was the main innovation of the 1860s bicycle?',
            options: ['The chain drive', 'Equal-sized wheels', 'The addition of pedals', 'Pneumatic tires'],
            answer: 'The addition of pedals'
          },
          {
            id: crypto.randomUUID(),
            type: QuestionType.MULTIPLE_CHOICE,
            questionNumber: 3,
            text: 'Which bicycle became the basis for modern designs?',
            options: ['The Laufmaschine', 'The penny-farthing', 'The safety bicycle', 'The velocipede'],
            answer: 'The safety bicycle'
          }
        ]
      },
      {
        id: crypto.randomUUID(),
        type: QuestionType.TRUE_FALSE_NOT_GIVEN,
        instructions: 'Do the following statements agree with the information in the passage? Write TRUE, FALSE, or NOT GIVEN.',
        startNumber: 4,
        endNumber: 6,
        questions: [
          {
            id: crypto.randomUUID(),
            type: QuestionType.TRUE_FALSE_NOT_GIVEN,
            questionNumber: 4,
            text: 'The first bicycle had pedals attached to it.',
            answer: 'FALSE'
          },
          {
            id: crypto.randomUUID(),
            type: QuestionType.TRUE_FALSE_NOT_GIVEN,
            questionNumber: 5,
            text: 'The penny-farthing was difficult to ride.',
            answer: 'TRUE'
          },
          {
            id: crypto.randomUUID(),
            type: QuestionType.TRUE_FALSE_NOT_GIVEN,
            questionNumber: 6,
            text: 'Modern bicycles are more expensive than 19th-century models.',
            answer: 'NOT GIVEN'
          }
        ]
      }
    ],
    totalQuestions: 6
  };

  // Create sample passage 2
  const passage2: Omit<Passage, 'id' | 'createdAt' | 'updatedAt'> = {
    title: 'Climate Change and Coral Reefs',
    content: `Coral reefs are among the most diverse and valuable ecosystems on Earth, often called the "rainforests of the sea." However, these vital marine environments are facing unprecedented threats from climate change, with rising ocean temperatures causing widespread coral bleaching events.

Coral bleaching occurs when corals, stressed by changes in temperature, light, or nutrients, expel the symbiotic algae living in their tissues. These algae, called zooxanthellae, provide corals with up to 90% of their energy through photosynthesis. Without them, corals turn white and, if conditions don't improve, eventually die.

The Great Barrier Reef, the world's largest coral reef system, has experienced several mass bleaching events in recent years. Scientists estimate that half of the reef's coral has died since 2016. This loss has far-reaching consequences, as coral reefs support approximately 25% of all marine species despite covering less than 1% of the ocean floor.

Beyond their ecological importance, coral reefs provide crucial economic benefits. They protect coastlines from storms and erosion, support fishing industries worth billions of dollars annually, and attract millions of tourists each year. The loss of coral reefs would be catastrophic for both marine biodiversity and human communities that depend on them.`,
    questionGroups: [
      {
        id: crypto.randomUUID(),
        type: QuestionType.SHORT_ANSWER,
        instructions: 'Answer the questions below. Write NO MORE THAN THREE WORDS for each answer.',
        startNumber: 1,
        endNumber: 3,
        questions: [
          {
            id: crypto.randomUUID(),
            type: QuestionType.SHORT_ANSWER,
            questionNumber: 1,
            text: 'What are coral reefs often called?',
            answer: 'rainforests of the sea',
            wordLimit: 3
          },
          {
            id: crypto.randomUUID(),
            type: QuestionType.SHORT_ANSWER,
            questionNumber: 2,
            text: 'What percentage of their energy do zooxanthellae provide to corals?',
            answer: '90%',
            wordLimit: 3
          },
          {
            id: crypto.randomUUID(),
            type: QuestionType.SHORT_ANSWER,
            questionNumber: 3,
            text: 'What is the world\'s largest coral reef system?',
            answer: 'Great Barrier Reef',
            wordLimit: 3
          }
        ]
      }
    ],
    totalQuestions: 3
  };

  // Save passages
  const savedPassage1 = createPassage(passage1);
  createPassage(passage2); // Save passage2 to library

  // Create a sample single passage test
  const singleTest: Omit<Test, 'id' | 'createdAt' | 'updatedAt'> = {
    title: 'IELTS Reading Practice - Bicycle History',
    description: 'A single passage test about the history of the bicycle',
    type: TestType.SINGLE_PASSAGE,
    passages: [savedPassage1],
    totalQuestions: savedPassage1.totalQuestions,
    timeLimit: 20,
    isPublished: true
  };

  createTest(singleTest);

  console.log('Sample data seeded successfully!');
  console.log('- Created 2 passages');
  console.log('- Created 1 test');
};

