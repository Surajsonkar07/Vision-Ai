/** The 80 COCO classes the COCO-SSD model can detect, with official COCO category ids. */
export interface CocoClass {
  id: number;
  name: string;
  group: string;
}

export const COCO_CLASSES: CocoClass[] = [
  { id: 1, name: "person", group: "people" },
  { id: 2, name: "bicycle", group: "vehicle" },
  { id: 3, name: "car", group: "vehicle" },
  { id: 4, name: "motorcycle", group: "vehicle" },
  { id: 5, name: "airplane", group: "vehicle" },
  { id: 6, name: "bus", group: "vehicle" },
  { id: 7, name: "train", group: "vehicle" },
  { id: 8, name: "truck", group: "vehicle" },
  { id: 9, name: "boat", group: "vehicle" },
  { id: 10, name: "traffic light", group: "street" },
  { id: 11, name: "fire hydrant", group: "street" },
  { id: 13, name: "stop sign", group: "street" },
  { id: 14, name: "parking meter", group: "street" },
  { id: 15, name: "bench", group: "street" },
  { id: 16, name: "bird", group: "animal" },
  { id: 17, name: "cat", group: "animal" },
  { id: 18, name: "dog", group: "animal" },
  { id: 19, name: "horse", group: "animal" },
  { id: 20, name: "sheep", group: "animal" },
  { id: 21, name: "cow", group: "animal" },
  { id: 22, name: "elephant", group: "animal" },
  { id: 23, name: "bear", group: "animal" },
  { id: 24, name: "zebra", group: "animal" },
  { id: 25, name: "giraffe", group: "animal" },
  { id: 27, name: "backpack", group: "accessory" },
  { id: 28, name: "umbrella", group: "accessory" },
  { id: 31, name: "handbag", group: "accessory" },
  { id: 32, name: "tie", group: "accessory" },
  { id: 33, name: "suitcase", group: "accessory" },
  { id: 34, name: "frisbee", group: "sport" },
  { id: 35, name: "skis", group: "sport" },
  { id: 36, name: "snowboard", group: "sport" },
  { id: 37, name: "sports ball", group: "sport" },
  { id: 38, name: "kite", group: "sport" },
  { id: 39, name: "baseball bat", group: "sport" },
  { id: 40, name: "baseball glove", group: "sport" },
  { id: 41, name: "skateboard", group: "sport" },
  { id: 42, name: "surfboard", group: "sport" },
  { id: 43, name: "tennis racket", group: "sport" },
  { id: 44, name: "bottle", group: "kitchen" },
  { id: 46, name: "wine glass", group: "kitchen" },
  { id: 47, name: "cup", group: "kitchen" },
  { id: 48, name: "fork", group: "kitchen" },
  { id: 49, name: "knife", group: "kitchen" },
  { id: 50, name: "spoon", group: "kitchen" },
  { id: 51, name: "bowl", group: "kitchen" },
  { id: 52, name: "banana", group: "food" },
  { id: 53, name: "apple", group: "food" },
  { id: 54, name: "sandwich", group: "food" },
  { id: 55, name: "orange", group: "food" },
  { id: 56, name: "broccoli", group: "food" },
  { id: 57, name: "carrot", group: "food" },
  { id: 58, name: "hot dog", group: "food" },
  { id: 59, name: "pizza", group: "food" },
  { id: 60, name: "donut", group: "food" },
  { id: 61, name: "cake", group: "food" },
  { id: 62, name: "chair", group: "furniture" },
  { id: 63, name: "couch", group: "furniture" },
  { id: 64, name: "potted plant", group: "furniture" },
  { id: 65, name: "bed", group: "furniture" },
  { id: 67, name: "dining table", group: "furniture" },
  { id: 70, name: "toilet", group: "furniture" },
  { id: 72, name: "tv", group: "electronic" },
  { id: 73, name: "laptop", group: "electronic" },
  { id: 74, name: "mouse", group: "electronic" },
  { id: 75, name: "remote", group: "electronic" },
  { id: 76, name: "keyboard", group: "electronic" },
  { id: 77, name: "cell phone", group: "electronic" },
  { id: 78, name: "microwave", group: "appliance" },
  { id: 79, name: "oven", group: "appliance" },
  { id: 80, name: "toaster", group: "appliance" },
  { id: 81, name: "sink", group: "appliance" },
  { id: 82, name: "refrigerator", group: "appliance" },
  { id: 84, name: "book", group: "indoor" },
  { id: 85, name: "clock", group: "indoor" },
  { id: 86, name: "vase", group: "indoor" },
  { id: 87, name: "scissors", group: "indoor" },
  { id: 88, name: "teddy bear", group: "indoor" },
  { id: 89, name: "hair drier", group: "indoor" },
  { id: 90, name: "toothbrush", group: "indoor" },
];

export const COCO_ID_BY_NAME: Record<string, number> = Object.fromEntries(
  COCO_CLASSES.map((c) => [c.name, c.id]),
);

export const COCO_GROUPS: { group: string; classes: string[] }[] = Object.entries(
  COCO_CLASSES.reduce<Record<string, string[]>>((acc, c) => {
    (acc[c.group] ??= []).push(c.name);
    return acc;
  }, {}),
).map(([group, classes]) => ({ group, classes }));

export const AI_LANGUAGES = [
  "English", "Hindi", "Bengali", "Tamil", "Telugu", "Kannada", "Malayalam", "Gujarati", "Marathi", "Punjabi", "Urdu",
  "Spanish", "French", "German", "Italian", "Portuguese", "Dutch", "Polish", "Russian", "Ukrainian", "Turkish",
  "Arabic", "Persian", "Hebrew", "Chinese", "Japanese", "Korean", "Vietnamese", "Thai", "Indonesian", "Malay",
  "Filipino", "Swedish", "Danish", "Norwegian", "Finnish", "Greek", "Czech", "Slovak", "Hungarian", "Romanian",
  "Croatian", "Serbian", "Slovenian", "Estonian", "Latvian", "Lithuanian", "Icelandic", "Catalan", "Basque",
  "Georgian", "Armenian", "Azerbaijani", "Kazakh", "Uzbek", "Mongolian", "Tibetan", "Burmese", "Khmer", "Lao",
];

/** BCP-47 tags for speech synthesis. */
export const SPEECH_LANG: Record<string, string> = {
  English: "en-US", Hindi: "hi-IN", Bengali: "bn-IN", Tamil: "ta-IN", Telugu: "te-IN", Kannada: "kn-IN",
  Malayalam: "ml-IN", Gujarati: "gu-IN", Marathi: "mr-IN", Punjabi: "pa-IN", Urdu: "ur-PK", Spanish: "es-ES",
  French: "fr-FR", German: "de-DE", Italian: "it-IT", Portuguese: "pt-PT", Dutch: "nl-NL", Polish: "pl-PL",
  Russian: "ru-RU", Ukrainian: "uk-UA", Turkish: "tr-TR", Arabic: "ar-SA", Persian: "fa-IR", Hebrew: "he-IL",
  Chinese: "zh-CN", Japanese: "ja-JP", Korean: "ko-KR", Vietnamese: "vi-VN", Thai: "th-TH", Indonesian: "id-ID",
  Malay: "ms-MY", Filipino: "fil-PH", Swedish: "sv-SE", Danish: "da-DK", Norwegian: "nb-NO", Finnish: "fi-FI",
  Greek: "el-GR", Czech: "cs-CZ", Slovak: "sk-SK", Hungarian: "hu-HU", Romanian: "ro-RO", Croatian: "hr-HR",
  Serbian: "sr-RS", Slovenian: "sl-SI", Estonian: "et-EE", Latvian: "lv-LV", Lithuanian: "lt-LT",
  Icelandic: "is-IS", Catalan: "ca-ES", Basque: "eu-ES", Georgian: "ka-GE", Armenian: "hy-AM",
  Azerbaijani: "az-AZ", Kazakh: "kk-KZ", Uzbek: "uz-UZ", Mongolian: "mn-MN", Burmese: "my-MM", Khmer: "km-KH",
  Lao: "lo-LA",
};
