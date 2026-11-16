import { useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import banknoteGuideUrl from '../assets/images/banknote_inspection_guide_1794513739971.jpg';
import marketVendorUrl from '../assets/images/vendor_mobile_payment_1794513739533.jpg';

const QUIZ_QUESTIONS = [
  {
    q: 'A buyer shows an MTN MoMo confirmation SMS on their phone and rushes to take goods. What should you do first?',
    options: [
      'Take a photo of their screen and release the goods',
      'Check your own wallet balance by dialing *165# before releasing goods',
      'Ask them to forward the SMS to your phone',
    ],
    correct: 1,
    explanation:
      'Screenshots and forwarded SMS messages are easily faked. Always verify funds directly on your own handset using *165# (MTN) or *185# (Airtel).',
  },
  {
    q: 'Which watermark appears when you hold a genuine Ugandan Shilling note against daylight?',
    options: [
      'A Crested Crane and the denomination numeral',
      'A plain blank oval with no shading',
      'A QR code printed in green ink',
    ],
    correct: 0,
    explanation:
      'Genuine Bank of Uganda notes show a multi-tonal Crested Crane watermark alongside an electrotype numeral inside the unprinted area.',
  },
  {
    q: 'A stranger claims they sent UGX 450,000 by mistake instead of UGX 45,000 and demands UGX 405,000 cash change. What is the safest response?',
    options: [
      'Give them the cash change quickly to avoid an argument',
      'Verify your actual Mobile Money balance via USSD first — fake overpayment SMS scams are common',
      'Send the balance to a different phone number they give you',
    ],
    correct: 1,
    explanation:
      'Overpayment reversal scams use edited SMS messages to trick vendors into handing over real cash. Always check your real balance first.',
  },
];

export function EducationView() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [img1Failed, setImg1Failed] = useState(false);
  const [img2Failed, setImg2Failed] = useState(false);

  return (
    <div className="space-y-6">
      {/* Section 1: Banknote Recognition */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-5 bg-slate-100 min-h-[220px]">
          {!img1Failed ? (
            <img
              src={banknoteGuideUrl}
              alt="Ugandan Shillings banknote security inspection"
              referrerPolicy="no-referrer"
              onError={() => setImg1Failed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6 text-slate-500 text-sm">
              Bank of Uganda Banknote Inspection
            </div>
          )}
        </div>

        <div className="lg:col-span-7 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
            <Banknote className="w-4 h-4" />
            <span>Counterfeit Banknote Prevention</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-balance">
            How to Recognize Genuine Bank of Uganda Notes
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            High-value notes (UGX 50,000, UGX 20,000, and UGX 10,000) are the
            most commonly counterfeited in busy markets. Train your hands and
            eyes using these three rapid checks:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-sm font-bold text-slate-900">1. Look</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Hold against sunlight to see the Crested Crane watermark and
                continuous dark security thread.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-sm font-bold text-slate-900">2. Feel</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Feel raised tactile ink along &ldquo;BANK OF UGANDA&rdquo; and
                crisp cotton paper texture.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-sm font-bold text-slate-900">3. Tilt</div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Tilt the note to watch the gold/iridescent holographic stripe
                shift color smoothly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Fake Mobile Money SMS Detection */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-4 order-2 lg:order-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Smartphone className="w-4 h-4" />
            <span>Mobile Money Scam Protection</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-balance">
            Spotting Fake MTN MoMo &amp; Airtel Money Confirmations
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Fraudsters use edited screenshots, fake SMS apps, or personal phone
            numbers disguised as official alerts. Compare genuine vs. spoofed
            patterns below:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
              <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Genuine Payment Habits</span>
              </div>
              <ul className="text-xs text-emerald-950 space-y-1.5 leading-relaxed">
                <li>
                  · Arrives directly on <strong>your</strong> phone from
                  official sender IDs (MTNMobMoney / AirtelMoney).
                </li>
                <li>· Shows your updated account balance accurately.</li>
                <li>
                  · Confirmed by dialing{' '}
                  <span className="font-mono font-bold">*165#</span> or{' '}
                  <span className="font-mono font-bold">*185#</span>.
                </li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-1.5">
              <div className="text-xs font-bold text-red-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Red Flags of Fake Alerts</span>
              </div>
              <ul className="text-xs text-red-950 space-y-1.5 leading-relaxed">
                <li>· Sent from a standard 10-digit personal mobile number.</li>
                <li>
                  · Buyer rushes you or claims an accidental overpayment asking
                  for cash change.
                </li>
                <li>
                  · Spelling mistakes, missing UGX balance, or suspicious links.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-100 min-h-[220px] order-1 lg:order-2">
          {!img2Failed ? (
            <img
              src={marketVendorUrl}
              alt="Market vendor checking mobile payment safely on smartphone"
              referrerPolicy="no-referrer"
              onError={() => setImg2Failed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-6 text-slate-500 text-sm">
              Safe Mobile Money Verification
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Common Market Scams */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Common Market Scams &amp; Safe Responses
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="text-sm font-bold text-slate-900">
              Distraction Note-Swapping
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              A buyer hands over a genuine note, takes it back claiming to look
              for smaller change, and swaps it for a counterfeit note. Always
              re-inspect any note that leaves your hand.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="text-sm font-bold text-slate-900">
              Overpayment Reversal Trick
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Scammers send a fake SMS showing UGX 400,000 instead of UGX 40,000
              and demand instant cash change. Never refund money without
              checking *165# or *185# first.
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 space-y-1.5">
            <div className="text-sm font-bold text-slate-900">
              Fake Agent / Support Calls
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Callers claiming to be MTN or Airtel staff asking for your PIN or
              an approval prompt to &ldquo;unlock a pending payment&rdquo; are
              fraudsters. Never share your Mobile Money PIN.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Interactive Self-Check Quiz */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center gap-2 text-emerald-700">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-lg font-bold text-slate-900">
            Vendor Fraud Readiness Check
          </h3>
        </div>

        <div className="space-y-5">
          {QUIZ_QUESTIONS.map((item, qIdx) => {
            const chosen = answers[qIdx];
            return (
              <div
                key={qIdx}
                className="p-4 rounded-xl border border-slate-200 space-y-3"
              >
                <div className="text-sm font-bold text-slate-900">
                  {qIdx + 1}. {item.q}
                </div>
                <div className="space-y-2">
                  {item.options.map((opt, oIdx) => {
                    const isPicked = chosen === oIdx;
                    const isRight = oIdx === item.correct;
                    let btnStyle =
                      'border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
                    if (chosen !== undefined) {
                      if (isRight) {
                        btnStyle =
                          'border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold';
                      } else if (isPicked) {
                        btnStyle =
                          'border-red-300 bg-red-50 text-red-900 font-semibold';
                      }
                    }

                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                        }
                        className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-left text-xs sm:text-sm transition-colors ${btnStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {chosen !== undefined && (
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {item.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
