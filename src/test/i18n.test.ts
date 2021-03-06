jest.mock('../utilities', () => ({
  translate: jest.fn(),
}));

import I18n from '../i18n';
import {LanguageDirection} from '../types';
import {MissingCurrencyCodeError, MissingTimezoneError} from '../errors';

const translate: jest.Mock = require('../utilities').translate;

describe('I18n', () => {
  const defaultDetails = {locale: 'en-ca'};
  const defaultTranslations = [{hello: 'Hello, {name}!'}];

  beforeEach(() => {
    translate.mockReset();
  });

  describe('#locale', () => {
    it('is exposed publicly', () => {
      const locale = 'fr-ca';
      const i18n = new I18n(defaultTranslations, {locale});
      expect(i18n).toHaveProperty('locale', locale);
    });

    it('is normalized', () => {
      const locale = 'fr-CA';
      const i18n = new I18n(defaultTranslations, {locale});
      expect(i18n).toHaveProperty('locale', locale.toLowerCase());
    });
  });

  describe('#language', () => {
    it('is determined from the locale', () => {
      const locale = 'fr-ca';
      const i18n = new I18n(defaultTranslations, {locale});
      expect(i18n).toHaveProperty('language', 'fr');
    });
  });

  describe('#languageDirection', () => {
    it('is LanguageDirection.Ltr for LTR languages', () => {
      expect(new I18n(defaultTranslations, {locale: 'en'})).toHaveProperty(
        'languageDirection',
        LanguageDirection.Ltr,
      );
    });

    it('is LanguageDirection.Rtl for RTL languages', () => {
      expect(new I18n(defaultTranslations, {locale: 'ar'})).toHaveProperty(
        'languageDirection',
        LanguageDirection.Rtl,
      );
    });
  });

  describe('#isLtrLanguage', () => {
    it('is true for LTR languages', () => {
      expect(new I18n(defaultTranslations, {locale: 'en'})).toHaveProperty(
        'isLtrLanguage',
        true,
      );
    });

    it('is false for RTL languages', () => {
      expect(new I18n(defaultTranslations, {locale: 'ar'})).toHaveProperty(
        'isLtrLanguage',
        false,
      );
    });
  });

  describe('#isRtlLanguage', () => {
    it('is false for LTR languages', () => {
      expect(new I18n(defaultTranslations, {locale: 'en'})).toHaveProperty(
        'isRtlLanguage',
        false,
      );
    });

    it('is true for RTL languages', () => {
      expect(new I18n(defaultTranslations, {locale: 'ar'})).toHaveProperty(
        'isRtlLanguage',
        true,
      );
    });
  });

  describe('#countryCode', () => {
    it('is determined from the locale', () => {
      const locale = 'fr-ca';
      const i18n = new I18n(defaultTranslations, {locale});
      expect(i18n).toHaveProperty('countryCode', 'ca');
    });

    it('is undefined when the locale does not have a country code', () => {
      const locale = 'fr';
      const i18n = new I18n(defaultTranslations, {locale});
      // eslint-disable-next-line no-undefined
      expect(i18n).toHaveProperty('countryCode', undefined);
    });
  });

  describe('#defaultCurrency', () => {
    it('is exposed publicly', () => {
      const defaultCurrency = 'CAD';
      const i18n = new I18n(defaultTranslations, {
        ...defaultDetails,
        currency: defaultCurrency,
      });
      expect(i18n).toHaveProperty('defaultCurrency', defaultCurrency);
    });
  });

  describe('#defaultTimezone', () => {
    it('is exposed publicly', () => {
      const defaultTimezone = 'EST';
      const i18n = new I18n(defaultTranslations, {
        ...defaultDetails,
        timezone: defaultTimezone,
      });
      expect(i18n).toHaveProperty('defaultTimezone', defaultTimezone);
    });
  });

  describe('#translate()', () => {
    it('calls the translate() utility with translations, key, locale, scope, and replacements', () => {
      const mockResult = 'translated string';
      const replacements = {name: 'Chris'};
      const scope = {scope: 'goodbye'};
      translate.mockReturnValue(mockResult);

      const i18n = new I18n(defaultTranslations, defaultDetails);
      const result = i18n.translate('hello', scope, replacements);

      expect(result).toBe(mockResult);
      expect(translate).toHaveBeenCalledWith(
        'hello',
        {...scope, replacements},
        defaultTranslations,
        i18n.locale,
      );
    });
  });

  describe('#formatNumber()', () => {
    it('formats a number using Intl', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const expected = new Intl.NumberFormat(defaultDetails.locale).format(
        1000,
      );

      expect(i18n.formatNumber(1000)).toBe(expected);
    });

    it('uses the precision argument for maximumFractionDigits', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const precision = 2;
      const expected = new Intl.NumberFormat(defaultDetails.locale, {
        maximumFractionDigits: precision,
      }).format(0.12345);

      expect(i18n.formatNumber(0.12345, {precision})).toBe(expected);
    });

    it('passes additional options to the number formatter', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const options: Partial<Intl.NumberFormatOptions> = {
        currencyDisplay: 'code',
        minimumIntegerDigits: 1,
        maximumFractionDigits: 1,
      };

      const expected = new Intl.NumberFormat(
        defaultDetails.locale,
        options,
      ).format(0.12345);

      expect(i18n.formatNumber(0.12345, options)).toBe(expected);
    });

    describe('currency', () => {
      const currency = 'USD';

      it('throws an error when no currency code is given as the default or as an option', () => {
        const i18n = new I18n(defaultTranslations, defaultDetails);
        expect(() => i18n.formatNumber(1, {as: 'currency'})).toThrowError(
          MissingCurrencyCodeError,
        );
      });

      it('uses the Intl number formatter with the default currency', () => {
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          currency,
        });

        const expected = Intl.NumberFormat(defaultDetails.locale, {
          style: 'currency',
          currency,
        }).format(1);

        expect(i18n.formatNumber(1, {as: 'currency'})).toBe(expected);
      });

      it('uses a custom currency provided in options', () => {
        const i18n = new I18n(defaultTranslations, defaultDetails);
        const expected = Intl.NumberFormat(defaultDetails.locale, {
          style: 'currency',
          currency,
        }).format(1);

        expect(i18n.formatNumber(1, {as: 'currency', currency})).toBe(expected);
      });

      it('passes additional options to the number formatter', () => {
        const i18n = new I18n(defaultTranslations, {
          ...defaultDetails,
          currency,
        });

        const options: Partial<Intl.NumberFormatOptions> = {
          currencyDisplay: 'code',
          minimumIntegerDigits: 1,
        };

        const expected = Intl.NumberFormat(defaultDetails.locale, {
          style: 'currency',
          currency,
          ...options,
        }).format(1);

        expect(i18n.formatNumber(1, {as: 'currency', ...options})).toBe(
          expected,
        );
      });
    });

    describe('percent', () => {
      it('formats the number as a percentage', () => {
        const i18n = new I18n(defaultTranslations, defaultDetails);
        const expected = Intl.NumberFormat(defaultDetails.locale, {
          style: 'percent',
        }).format(50);
        expect(i18n.formatNumber(50, {as: 'percent'})).toBe(expected);
      });
    });
  });

  describe('#formatDate()', () => {
    const timezone = 'Australia/Sydney';

    it('formats a date using Intl', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, {...defaultDetails, timezone});
      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: timezone,
      }).format(date);
      expect(i18n.formatDate(date)).toBe(expected);
    });

    it('passes additional options to the date formatter', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, {...defaultDetails, timezone});
      const options: Partial<Intl.DateTimeFormatOptions> = {
        era: 'narrow',
      };

      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: timezone,
        ...options,
      }).format(date);

      expect(i18n.formatDate(date, options)).toBe(expected);
    });

    it('throws an error when no timezone is given as the default or as an option', () => {
      const i18n = new I18n(defaultTranslations, defaultDetails);
      expect(() => i18n.formatDate(new Date())).toThrowError(
        MissingTimezoneError,
      );
    });

    it('uses the Intl number formatter with the default timezone', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, {
        ...defaultDetails,
        timezone,
      });

      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: timezone,
      }).format(date);

      expect(i18n.formatDate(date)).toBe(expected);
    });

    it('uses a custom timezone provided in options', () => {
      const date = new Date();
      const i18n = new I18n(defaultTranslations, defaultDetails);
      const expected = new Intl.DateTimeFormat(defaultDetails.locale, {
        timeZone: timezone,
      }).format(date);

      expect(i18n.formatDate(date, {timeZone: timezone})).toBe(expected);
    });
  });
});
