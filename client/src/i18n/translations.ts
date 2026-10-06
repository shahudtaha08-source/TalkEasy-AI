import type { LanguageCode, Translations } from "./types";
import { english } from "./english";
import { hindi } from "./lang/hindi";
import { urdu } from "./lang/urdu";
import { marathi } from "./lang/marathi";
import { tamil } from "./lang/tamil";
import { telugu } from "./lang/telugu";
import { malayalam } from "./lang/malayalam";
import { kannada } from "./lang/kannada";
import { bengali } from "./lang/bengali";
import { gujarati } from "./lang/gujarati";

export type { LanguageCode, Translations };

/**
 * Every language starts from the complete English dictionary and overrides
 * whichever keys it has translated. `LanguageContext.t()` also falls back to
 * English at lookup time, so a missing key can never surface as a raw key.
 */
export const translations: Record<LanguageCode, Translations> = {
  English: english,
  Hindi: { ...english, ...hindi },
  Urdu: { ...english, ...urdu },
  Marathi: { ...english, ...marathi },
  Tamil: { ...english, ...tamil },
  Telugu: { ...english, ...telugu },
  Malayalam: { ...english, ...malayalam },
  Kannada: { ...english, ...kannada },
  Bengali: { ...english, ...bengali },
  Gujarati: { ...english, ...gujarati },
};
