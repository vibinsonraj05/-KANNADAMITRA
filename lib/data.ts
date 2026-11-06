export type Phrase = { kn: string; roman: string; en: string; tip?: string };
export type LessonLevel = "beginner" | "intermediate" | "advanced";
export type Lesson = { slug: string; title: string; blurb: string; scene: string; level?: LessonLevel; phrases: Phrase[] };

export const lessons: Lesson[] = [
  {
    slug: "greetings", title: "Greetings", scene: "ನಮಸ್ಕಾರ", level: "beginner",
    blurb: "Meet someone, introduce yourself, and be polite.",
    phrases: [
      { kn: "ನಮಸ್ಕಾರ", roman: "Namaskara", en: "Hello", tip: "Works at any time of day, with anyone." },
      { kn: "ಹೇಗಿದ್ದೀರಾ?", roman: "Hegiddira?", en: "How are you?", tip: "-ra ending is the respectful form." },
      { kn: "ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ", roman: "Naanu chennagiddene", en: "I am fine" },
      { kn: "ನಿಮ್ಮ ಹೆಸರೇನು?", roman: "Nimma hesarenu?", en: "What is your name?" },
      { kn: "ನನ್ನ ಹೆಸರು …", roman: "Nanna hesaru …", en: "My name is …" },
      { kn: "ಧನ್ಯವಾದಗಳು", roman: "Dhanyavadagalu", en: "Thank you" },
    ],
  },
  {
    slug: "market", title: "Shopping", scene: "ಎಷ್ಟು?", level: "beginner",
    blurb: "Ask prices, bargain kindly, and buy by weight.",
    phrases: [
      { kn: "ಇದು ಎಷ್ಟು?", roman: "Idu eshtu?", en: "How much is this?" },
      { kn: "ತುಂಬಾ ಜಾಸ್ತಿ", roman: "Tumba jaasti", en: "Too expensive" },
      { kn: "ಸ್ವಲ್ಪ ಕಡಿಮೆ ಮಾಡಿ", roman: "Svalpa kadime maadi", en: "Please reduce it a little" },
      { kn: "ಒಂದು ಕಿಲೋ ಕೊಡಿ", roman: "Ondu kilo kodi", en: "Give me one kilo", tip: "kodi = please give." },
      { kn: "ಚಿಲ್ಲರೆ ಇದೆಯಾ?", roman: "Chillare ideya?", en: "Do you have change?" },
    ],
  },
  {
    slug: "transport", title: "Auto and bus travel", scene: "ಎಲ್ಲಿ?", level: "beginner",
    blurb: "Autos, buses, and directions in the city.",
    phrases: [
      { kn: "ಇಲ್ಲಿ ನಿಲ್ಲಿಸಿ", roman: "Illi nillisi", en: "Stop here" },
      { kn: "ಬಲಕ್ಕೆ ತಿರುಗಿ", roman: "Balakke tirugi", en: "Turn right" },
      { kn: "ಎಡಕ್ಕೆ ತಿರುಗಿ", roman: "Edakke tirugi", en: "Turn left" },
      { kn: "ನೇರವಾಗಿ ಹೋಗಿ", roman: "Neravaagi hogi", en: "Go straight" },
      { kn: "ಮೀಟರ್ ಹಾಕಿ", roman: "Meter haaki", en: "Please use the meter" },
    ],
  },
  {
    slug: "food", title: "Food and drinks", scene: "ರುಚಿ", level: "beginner",
    blurb: "Order, adjust spice, and ask for the bill.",
    phrases: [
      { kn: "ಒಂದು ಕಾಫಿ ಕೊಡಿ", roman: "Ondu coffee kodi", en: "One coffee, please" },
      { kn: "ನೀರು ಬೇಕು", roman: "Neeru beku", en: "I need water", tip: "beku = want / need." },
      { kn: "ಖಾರ ಕಡಿಮೆ", roman: "Khaara kadime", en: "Less spicy" },
      { kn: "ರುಚಿಯಾಗಿದೆ", roman: "Ruchiyagide", en: "It is tasty" },
      { kn: "ಬಿಲ್ ಕೊಡಿ", roman: "Bill kodi", en: "Bill, please" },
    ],
  },
  {
    slug: "everyday", title: "Everyday conversations", scene: "ಮಾತು", level: "beginner",
    blurb: "Small talk and what to say when you are lost in the conversation.",
    phrases: [
      { kn: "ಇಂದು ಹವಾಮಾನ ಚೆನ್ನಾಗಿದೆ", roman: "Indu havamaana chennagide", en: "The weather is nice today" },
      { kn: "ನಿಮಗೆ ಕನ್ನಡ ಗೊತ್ತಾ?", roman: "Nimge Kannada gottha?", en: "Do you know Kannada?" },
      { kn: "ನನಗೆ ಸ್ವಲ್ಪ ಕನ್ನಡ ಗೊತ್ತು", roman: "Nange svalpa Kannada gottu", en: "I know a little Kannada" },
      { kn: "ಇನ್ನೊಮ್ಮೆ ಹೇಳಿ", roman: "Innomme heli", en: "Please say it once more" },
      { kn: "ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ", roman: "Nange arthavaagalilla", en: "I did not understand" },
    ],
  },
  {
    slug: "directions", title: "Asking for directions", scene: "ದಾರಿ", level: "intermediate",
    blurb: "Find places and understand the answer.",
    phrases: [
      { kn: "ಬಸ್ ನಿಲ್ದಾಣ ಎಲ್ಲಿದೆ?", roman: "Bus nildaana ellide?", en: "Where is the bus stand?" },
      { kn: "ಇಲ್ಲಿಂದ ದೂರ ಇದೆಯಾ?", roman: "Illinda doora ideya?", en: "Is it far from here?" },
      { kn: "ಹತ್ತಿರದಲ್ಲಿದೆ", roman: "Hattiradalli ide", en: "It is nearby" },
      { kn: "ಮುಂದೆ ಹೋಗಿ", roman: "Munde hogi", en: "Go ahead" },
      { kn: "ನಾನು ದಾರಿ ತಪ್ಪಿದ್ದೇನೆ", roman: "Naanu daari tappiddene", en: "I am lost" },
    ],
  },
  {
    slug: "college", title: "College conversations", scene: "ಕಾಲೇಜು", level: "intermediate",
    blurb: "Classes, notes, and exams with classmates.",
    phrases: [
      { kn: "ನೀವು ಯಾವ ವಿಭಾಗ?", roman: "Neevu yaava vibhaaga?", en: "Which department are you in?" },
      { kn: "ತರಗತಿ ಯಾವಾಗ ಶುರು?", roman: "Taragati yaavaaga shuru?", en: "When does the class start?" },
      { kn: "ನೋಟ್ಸ್ ಕೊಡ್ತೀರಾ?", roman: "Notes kodtira?", en: "Can you give me the notes?" },
      { kn: "ಪರೀಕ್ಷೆ ಯಾವಾಗ?", roman: "Pareekshe yaavaaga?", en: "When is the exam?" },
      { kn: "ಲೈಬ್ರರಿ ಎಲ್ಲಿದೆ?", roman: "Library ellide?", en: "Where is the library?" },
    ],
  },
  {
    slug: "work", title: "Workplace conversations", scene: "ಕೆಲಸ", level: "intermediate",
    blurb: "Polite, everyday phrases with colleagues.",
    phrases: [
      { kn: "ಶುಭೋದಯ", roman: "Shubhodaya", en: "Good morning" },
      { kn: "ಮೀಟಿಂಗ್ ಯಾವಾಗ?", roman: "Meeting yaavaaga?", en: "When is the meeting?" },
      { kn: "ದಯವಿಟ್ಟು ಇದನ್ನು ನೋಡಿ", roman: "Dayavittu idannu nodi", en: "Please look at this" },
      { kn: "ನಾಳೆ ಮಾಡ್ತೀನಿ", roman: "Naale maadteeni", en: "I will do it tomorrow" },
      { kn: "ಸಹಾಯ ಬೇಕಾ?", roman: "Sahaaya bekaa?", en: "Do you need help?" },
    ],
  },
  {
    slug: "neighbours", title: "Talking with neighbours", scene: "ನೆರೆಹೊರೆ", level: "advanced",
    blurb: "Be friendly where you live.",
    phrases: [
      { kn: "ನಾವು ಹೊಸದಾಗಿ ಬಂದಿದ್ದೇವೆ", roman: "Naavu hosadaagi bandiddeve", en: "We have just moved in" },
      { kn: "ನೀವು ಇಲ್ಲಿ ಎಷ್ಟು ವರ್ಷದಿಂದ ಇದ್ದೀರಾ?", roman: "Neevu illi eshtu varshadinda iddira?", en: "How many years have you lived here?" },
      { kn: "ಮನೆಯಲ್ಲಿ ಎಲ್ಲರೂ ಹೇಗಿದ್ದಾರೆ?", roman: "Maneyalli ellaru hegiddare?", en: "How is everyone at home?" },
      { kn: "ಬನ್ನಿ, ಕಾಫಿ ಕುಡಿಯೋಣ", roman: "Banni, coffee kudiyona", en: "Come, let us have coffee" },
      { kn: "ಹೋಗಿ ಬರ್ತೀನಿ", roman: "Hogi barteeni", en: "I will be going now (see you)" },
    ],
  },
  {
    slug: "life-karnataka", title: "Life in Karnataka", scene: "ಕರ್ನಾಟಕ", level: "intermediate",
    blurb: "Use everyday courtesies and local phrases while exploring Karnataka.",
    phrases: [
      { kn: "ನಮಸ್ಕಾರ, ಕರ್ನಾಟಕಕ್ಕೆ ಸ್ವಾಗತ", roman: "Namaskaara, Karnatakaakke swaagata", en: "Hello, welcome to Karnataka" },
      { kn: "ಇದು ತುಂಬಾ ಸುಂದರವಾಗಿದೆ", roman: "Idu tumbaa sundaravaagide", en: "This is very beautiful" },
      { kn: "ಹತ್ತಿರದಲ್ಲಿ ದೇವಸ್ಥಾನ ಇದೆಯಾ?", roman: "Hattiradalli devasthaana ideyaa?", en: "Is there a temple nearby?" },
      { kn: "ಸ್ಥಳೀಯ ಊಟ ಎಲ್ಲ ಸಿಗುತ್ತದೆ?", roman: "Sthaleeya oota elli siguttade?", en: "Where can I find local food?" },
      { kn: "ನಿಮ್ಮ ಸಹಾಯಕ್ಕೆ ಧನ್ಯವಾದಗಳು", roman: "Nimma sahaayakke dhanyavaadagalu", en: "Thank you for your help" },
    ],
  },
  {
    slug: "fluent-communication", title: "Fluent communication", scene: "ಸಂವಾದ", level: "advanced",
    blurb: "Connect ideas, ask follow-up questions, and keep a conversation going.",
    phrases: [
      { kn: "ನನಗೆ ನಿಮ್ಮ ಮಾತು ಅರ್ಥವಾಯಿತು", roman: "Nange nimma maatu arthavaayitu", en: "I understood what you said" },
      { kn: "ನೀವು ಸ್ವಲ್ಪ ನಿಧಾನವಾಗಿ ಮಾತನಾಡುತ್ತೀರಾ?", roman: "Neevu svalpa nidhaanavaagi maatanaaduttiraa?", en: "Could you speak a little slowly?" },
      { kn: "ನನ್ನ ಅಭಿಪ್ರಾಯದಲ್ಲಿ ಇದು ಒಳ್ಳೆಯದು", roman: "Nanna abhipraayadalli idu olleyadu", en: "In my opinion, this is good" },
      { kn: "ಇದರ ಬಗ್ಗೆ ಇನ್ನಷ್ಟು ಹೇಳಿ", roman: "Idara bagge innashtu heli", en: "Tell me more about this" },
      { kn: "ನಿಮ್ಮ ಜೊತೆ ಮಾತನಾಡಿ ಸಂತೋಷವಾಯಿತು", roman: "Nimma jote maatanaadi santoshavaayitu", en: "It was nice talking with you" },
    ],
  },
];

export const getLesson = (slug: string) => lessons.find((l) => l.slug === slug);
