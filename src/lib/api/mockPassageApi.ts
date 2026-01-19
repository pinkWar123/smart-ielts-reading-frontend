import type { ExtendedPassage, PassageImage, ExtractionStatus } from '../types/passage';
import type { QuestionType } from '../types/question';

// Simulated delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage for mock data
const mockPassages = new Map<string, ExtendedPassage>();
const mockExtractionStatuses = new Map<string, ExtractionStatus>();

// Sample extracted data from the provided response
const SAMPLE_EXTRACTED_DATA = {
  title: "IELTS Reading Passage 1: Investing in the Future",
  description: "Reading comprehension test about the University of Auckland's fundraising history and campaigns",
  content: "The founding and development of many universities has been dependent on philanthropy. This has been true from some of the oldest universities such as Bologna, Oxford and Cambridge in the twelfth century, to relative newcomers like the universities of Harvard and Yale in the seventeenth century. Wealthy merchants gave young institutions money, land, libraries and rare items. Their belief in the value of higher learning is echoed by the growing number of philanthropists whose gifts have helped transform the University of Auckland, the largest university in New Zealand.\n\nIn 1884 Mr Justice Gillies made history when he gave $3,000 to the then very young University of Auckland, and so became its original philanthropist. Gillies' gift was more generous even than those regularly given to New Zealand's older University of Otago, and was exceptional because Auckland had a smaller population and was less wealthy than the other university cities at that time. However, from the 1930s privately funded prizes and scholarships began to be seen more frequently in Auckland. In that decade a local engineer and former lecturer in engineering, Samuel Crookes, launched a fund to save the engineering school in Auckland, which the state was determined to see discontinued, and raised over $6,500 in three years. Another significant philanthropist, Sir William Goodfellow, made his initial gift to the University in 1947 – $50,000 to build the Maclaurin Chapel. Since then, he and succeeding generations of the family have given numerous scholarships and fellowships and established a school within the University bearing the family's name.\n\nThe University had a difficult decade in the 1950s as it was short of equipment, buildings and money. It also had its first taste of international rivalry, when universities in many parts of the world competed to attract first class lecturers. In Auckland the problem largely resulted from the fact that academic salaries had slipped well behind those available in Britain and Australia, so the strongest candidates tended to be recruited to those countries. But when the new Medical School opened in 1968, it attracted significant gifts for academic positions and equipment from an unusually wide range of donors, including individuals, trusts, charitable foundations, societies and community groups. It also became the permanent home of the Philson Library, which by then consisted of some 8,000 books.\n\nThe first of the modern public appeals for funds took place in the 1960s, when Alan Highel built the Student Union complex. This was followed by another appeal in 1983 under the then Chancellor Henry Cooper who raised $800,000 to celebrate the University's centenary. These modern campaigns built on the successful campaigns of the past but included a number of new features. There was of course the familiar emphasis on donations from individuals, but the modern approach also stressed the importance of bringing the University and business closer together and specifically seeking donations from that sector.\n\nBuilding on this success, the current 'Leading the Way' campaign was launched. It is intended as a drive to secure support for the whole University, with a focus on generating funds to recruit, support and retain the very best staff for the University. The current campaign has raised the whole process of philanthropy to a new level, and changed expectations. The University is investing considerable time and energy in devising new methods of fund-raising both within its local communities and – remembering that New Zealanders love to travel – by looking at campaigns in other parts of the world, and targeting alumni, or former students now living overseas.\n\n'What it taught us,' says John Taylor, Director of External Relations, 'was that the campaign had to fit into the Strategic Plan of the University … As we kept talking we realised that we could have a transformative effect on the future of New Zealand by highlighting the potential benefits of high quality research.' The example Taylor gives is the $4.5 million gift to establish an information centre at the University's Marine Science laboratory on the coast at Leigh. He stresses that the fund-raising drive was so successful in part because the publicity used at the time highlighted the public benefit from the project.\n\nOn the financial side, the University's Vice-Chancellor, Stuart McCutcheon, explains that a fault they found in their campaigns actually turned out to be a stroke of good fortune. 'In the course of these new fund-raising systems,' he says, 'we have come to realise that there has been considerable giving to the University that has not been previously recorded through our Advancement Office … This has been in the order of $10 million per year over the campaign period.' The good news from this error is that at the recent Chancellor's dinner it was announced that the campaign target was now being increased from $100 million to $150 million, and would recognise all sources of philanthropic support. It's a long way from Gillies' first $3,000 gift.",
  paragraphs: [
    "The founding and development of many universities has been dependent on philanthropy. This has been true from some of the oldest universities such as Bologna, Oxford and Cambridge in the twelfth century, to relative newcomers like the universities of Harvard and Yale in the seventeenth century. Wealthy merchants gave young institutions money, land, libraries and rare items. Their belief in the value of higher learning is echoed by the growing number of philanthropists whose gifts have helped transform the University of Auckland, the largest university in New Zealand.",
    "In 1884 Mr Justice Gillies made history when he gave $3,000 to the then very young University of Auckland, and so became its original philanthropist. Gillies' gift was more generous even than those regularly given to New Zealand's older University of Otago, and was exceptional because Auckland had a smaller population and was less wealthy than the other university cities at that time. However, from the 1930s privately funded prizes and scholarships began to be seen more frequently in Auckland. In that decade a local engineer and former lecturer in engineering, Samuel Crookes, launched a fund to save the engineering school in Auckland, which the state was determined to see discontinued, and raised over $6,500 in three years. Another significant philanthropist, Sir William Goodfellow, made his initial gift to the University in 1947 – $50,000 to build the Maclaurin Chapel. Since then, he and succeeding generations of the family have given numerous scholarships and fellowships and established a school within the University bearing the family's name.",
    "The University had a difficult decade in the 1950s as it was short of equipment, buildings and money. It also had its first taste of international rivalry, when universities in many parts of the world competed to attract first class lecturers. In Auckland the problem largely resulted from the fact that academic salaries had slipped well behind those available in Britain and Australia, so the strongest candidates tended to be recruited to those countries. But when the new Medical School opened in 1968, it attracted significant gifts for academic positions and equipment from an unusually wide range of donors, including individuals, trusts, charitable foundations, societies and community groups. It also became the permanent home of the Philson Library, which by then consisted of some 8,000 books.",
    "The first of the modern public appeals for funds took place in the 1960s, when Alan Highel built the Student Union complex. This was followed by another appeal in 1983 under the then Chancellor Henry Cooper who raised $800,000 to celebrate the University's centenary. These modern campaigns built on the successful campaigns of the past but included a number of new features. There was of course the familiar emphasis on donations from individuals, but the modern approach also stressed the importance of bringing the University and business closer together and specifically seeking donations from that sector.",
    "Building on this success, the current 'Leading the Way' campaign was launched. It is intended as a drive to secure support for the whole University, with a focus on generating funds to recruit, support and retain the very best staff for the University. The current campaign has raised the whole process of philanthropy to a new level, and changed expectations. The University is investing considerable time and energy in devising new methods of fund-raising both within its local communities and – remembering that New Zealanders love to travel – by looking at campaigns in other parts of the world, and targeting alumni, or former students now living overseas.",
    "'What it taught us,' says John Taylor, Director of External Relations, 'was that the campaign had to fit into the Strategic Plan of the University … As we kept talking we realised that we could have a transformative effect on the future of New Zealand by highlighting the potential benefits of high quality research.' The example Taylor gives is the $4.5 million gift to establish an information centre at the University's Marine Science laboratory on the coast at Leigh. He stresses that the fund-raising drive was so successful in part because the publicity used at the time highlighted the public benefit from the project.",
    "On the financial side, the University's Vice-Chancellor, Stuart McCutcheon, explains that a fault they found in their campaigns actually turned out to be a stroke of good fortune. 'In the course of these new fund-raising systems,' he says, 'we have come to realise that there has been considerable giving to the University that has not been previously recorded through our Advancement Office … This has been in the order of $10 million per year over the campaign period.' The good news from this error is that at the recent Chancellor's dinner it was announced that the campaign target was now being increased from $100 million to $150 million, and would recognise all sources of philanthropic support. It's a long way from Gillies' first $3,000 gift."
  ],
  wordCount: 1050,
  totalQuestions: 13,
  questionGroups: [
    {
      id: 'qg-1',
      type: 'TRUE_FALSE_NOT_GIVEN' as QuestionType,
      instructions: "Questions 1-8: Do the following statements agree with the information given in Reading Passage 1? In boxes 1-8 on your answer sheet, write TRUE if the statement agrees with the information, FALSE if the statement contradicts the information, NOT GIVEN if there is no information on this.",
      startNumber: 1,
      endNumber: 8,
      questions: [
        {
          id: 'q-1',
          questionNumber: 1,
          type: 'TRUE_FALSE_NOT_GIVEN' as QuestionType,
          text: "Harvard and Yale were the first universities to benefit from philanthropy.",
          correctAnswer: "FALSE",
          explanation: null,
        },
        {
          id: 'q-2',
          questionNumber: 2,
          type: 'TRUE_FALSE_NOT_GIVEN' as QuestionType,
          text: "Merchants liked to donate to the same universities they attended themselves.",
          correctAnswer: "NOT GIVEN",
          explanation: null,
        },
        {
          id: 'q-3',
          questionNumber: 3,
          type: 'TRUE_FALSE_NOT_GIVEN' as QuestionType,
          text: "The first gift to the University of Auckland came in 1884.",
          correctAnswer: "TRUE",
          explanation: null,
        },
        {
          id: 'q-4',
          questionNumber: 4,
          type: 'TRUE_FALSE_NOT_GIVEN' as QuestionType,
          text: "Otago University often received larger gifts than Gillies' gift to Auckland.",
          correctAnswer: "FALSE",
          explanation: null,
        },
        {
          id: 'q-5',
          questionNumber: 5,
          type: 'TRUE_FALSE_NOT_GIVEN' as QuestionType,
          text: "In the 1930s the government wanted to close Auckland's engineering school.",
          correctAnswer: "TRUE",
          explanation: null,
        },
        {
          id: 'q-6',
          questionNumber: 6,
          type: 'TRUE_FALSE_NOT_GIVEN' as QuestionType,
          text: "After raising $6,500, Crookes returned to academic life.",
          correctAnswer: "NOT GIVEN",
          explanation: null,
        },
        {
          id: 'q-7',
          questionNumber: 7,
          type: 'TRUE_FALSE_NOT_GIVEN' as QuestionType,
          text: "In the 1950s the best lecturers chose to work in Britain or Australia rather than Auckland.",
          correctAnswer: "TRUE",
          explanation: null,
        },
        {
          id: 'q-8',
          questionNumber: 8,
          type: 'TRUE_FALSE_NOT_GIVEN' as QuestionType,
          text: "A single philanthropist was responsible for the new Medical School.",
          correctAnswer: "FALSE",
          explanation: null,
        },
      ],
    },
    {
      id: 'qg-2',
      type: 'NOTE_COMPLETION' as QuestionType,
      instructions: "Questions 9-13: Complete the notes below. Choose ONE WORD ONLY from the passage for each answer. Write your answer in boxes 9-13 on your answer sheet.",
      startNumber: 9,
      endNumber: 13,
      questions: [
        {
          id: 'q-9',
          questionNumber: 9,
          type: 'NOTE_COMPLETION' as QuestionType,
          text: "Henry Cooper's campaign marked the 9............ of the University",
          correctAnswer: "centenary",
          explanation: null,
        },
        {
          id: 'q-10',
          questionNumber: 10,
          type: 'NOTE_COMPLETION' as QuestionType,
          text: "this appeal is raising money to invest in the University's 10................",
          correctAnswer: "staff",
          explanation: null,
        },
        {
          id: 'q-11',
          questionNumber: 11,
          type: 'NOTE_COMPLETION' as QuestionType,
          text: "gifts are being sought from graduates who are located 11..................",
          correctAnswer: "overseas",
          explanation: null,
        },
        {
          id: 'q-12',
          questionNumber: 12,
          type: 'NOTE_COMPLETION' as QuestionType,
          text: "some donations had not been 12................. by the University",
          correctAnswer: "recorded",
          explanation: null,
        },
        {
          id: 'q-13',
          questionNumber: 13,
          type: 'NOTE_COMPLETION' as QuestionType,
          text: "there is a new financial 13................ for the campaign",
          correctAnswer: "target",
          explanation: null,
        },
      ],
    },
  ],
};

export const mockPassageAPI = {
  /**
   * Create an empty passage with just a title
   */
  createPassage: async (data: { title: string }) => {
    await delay(300);
    const id = `passage-${Date.now()}`;
    const passage: ExtendedPassage = {
      id,
      title: data.title,
      content: '',
      paragraphs: [],
      status: 'draft',
      extractionStatus: 'pending',
      questionGroups: [],
      totalQuestions: 0,
      wordCount: 0,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPassages.set(id, passage);
    return { success: true, data: passage };
  },

  /**
   * Upload images for a passage
   */
  uploadImages: async (passageId: string, images: File[]) => {
    await delay(1500); // Simulate upload time
    const imageRecords: PassageImage[] = images.map((img, i) => ({
      id: `img-${Date.now()}-${i}`,
      imageUrl: URL.createObjectURL(img), // Temporary local URL
      fileName: img.name,
      fileSize: img.size,
      imageOrder: i,
    }));

    const passage = mockPassages.get(passageId);
    if (passage) {
      passage.images = imageRecords;
      mockPassages.set(passageId, passage);
    }

    return { success: true, data: { uploadedImages: imageRecords } };
  },

  /**
   * Trigger AI extraction (simulates backend processing)
   */
  triggerExtraction: async (passageId: string) => {
    await delay(200);
    mockExtractionStatuses.set(passageId, 'processing');

    const passage = mockPassages.get(passageId);
    if (passage) {
      passage.extractionStatus = 'processing';
      passage.status = 'processing';
      mockPassages.set(passageId, passage);
    }

    // Simulate extraction completing after 5 seconds
    setTimeout(() => {
      mockExtractionStatuses.set(passageId, 'completed');
      const passage = mockPassages.get(passageId);
      if (passage) {
        passage.extractionStatus = 'completed';
        passage.status = 'ready';
        // Add mock extracted data from sample response
        passage.content = SAMPLE_EXTRACTED_DATA.content;
        passage.paragraphs = SAMPLE_EXTRACTED_DATA.paragraphs;
        passage.questionGroups = SAMPLE_EXTRACTED_DATA.questionGroups;
        passage.totalQuestions = SAMPLE_EXTRACTED_DATA.totalQuestions;
        passage.wordCount = SAMPLE_EXTRACTED_DATA.wordCount;
        mockPassages.set(passageId, passage);
      }
    }, 5000);

    return {
      success: true,
      data: {
        passageId,
        extractionStatus: 'processing',
        message: 'Extraction started. This may take 30-60 seconds.',
      },
    };
  },

  /**
   * Poll extraction status
   */
  getExtractionStatus: async (passageId: string) => {
    await delay(100);
    const status = mockExtractionStatuses.get(passageId) || 'pending';
    const passage = mockPassages.get(passageId);

    return {
      success: true,
      data: {
        passageId,
        extractionStatus: status,
        status: passage?.status || 'draft',
        completedAt: status === 'completed' ? new Date().toISOString() : null,
      },
    };
  },

  /**
   * Get passage preview with all extracted data
   */
  getPassagePreview: async (passageId: string) => {
    await delay(300);
    const passage = mockPassages.get(passageId);
    if (!passage) {
      return { success: false, error: 'Passage not found' };
    }
    return { success: true, data: passage };
  },

  /**
   * Update passage content (title, content, paragraphs)
   */
  updatePassage: async (passageId: string, updates: Partial<ExtendedPassage>) => {
    await delay(200);
    const passage = mockPassages.get(passageId);
    if (passage) {
      Object.assign(passage, updates);
      passage.updatedAt = new Date();
      mockPassages.set(passageId, passage);
      return { success: true, data: passage };
    }
    return { success: false, error: 'Passage not found' };
  },

  /**
   * Update a specific question
   */
  updateQuestion: async (passageId: string, questionId: string, updates: any) => {
    await delay(200);
    const passage = mockPassages.get(passageId);
    if (passage) {
      // Find and update the question
      for (const group of passage.questionGroups) {
        const question = group.questions.find(q => q.id === questionId);
        if (question) {
          Object.assign(question, updates);
          passage.updatedAt = new Date();
          mockPassages.set(passageId, passage);
          return { success: true, data: passage };
        }
      }
    }
    return { success: false, error: 'Question not found' };
  },

  /**
   * Finalize passage (mark as ready to be added to tests)
   */
  finalizePassage: async (passageId: string) => {
    await delay(300);
    const passage = mockPassages.get(passageId);
    if (passage) {
      passage.status = 'finalized';
      passage.updatedAt = new Date();
      mockPassages.set(passageId, passage);
      return { success: true, data: passage };
    }
    return { success: false, error: 'Passage not found' };
  },

  /**
   * Get all passages (for listing)
   */
  getAllPassages: async () => {
    await delay(200);
    const passages = Array.from(mockPassages.values());
    return { success: true, data: passages };
  },

  /**
   * Delete a passage
   */
  deletePassage: async (passageId: string) => {
    await delay(200);
    const deleted = mockPassages.delete(passageId);
    mockExtractionStatuses.delete(passageId);
    return { success: deleted, data: { id: passageId } };
  },
};
