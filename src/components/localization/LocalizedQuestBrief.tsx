import { useMemo } from 'react';
import type { GrowthQuest } from '../../domain/types';
import { BookOpenText, Sparkles } from 'lucide-react';
import './LocalizedQuestBrief.css';

type LocalizedBrief = {
  title: string;
  summary: string;
  nextStep: string;
  bullets: string[];
};

const buildEnglishBrief = (quest: GrowthQuest): LocalizedBrief => ({
  title: quest.title,
  summary: quest.description,
  nextStep: 'Review the objectives, complete the checklist, and save one relevant Skill Boost.',
  bullets: quest.objectives.slice(0, 3).map((objective) => objective.description),
});

type LocalizedQuestBriefProps = {
  quest: GrowthQuest;
};

export function LocalizedQuestBrief({ quest }: LocalizedQuestBriefProps) {
  const brief = useMemo(() => buildEnglishBrief(quest), [quest]);

  return (
    <section className="localized-quest-brief" aria-labelledby="localized-quest-brief-title">
      <div className="localized-quest-brief__header">
        <div>
          <span className="localized-quest-brief__kicker">
            <BookOpenText size={16} aria-hidden="true" />
            Contributor guidance
          </span>
          <h2 id="localized-quest-brief-title">Plain-language quest brief</h2>
          <p>Turn the quest into a concise action brief before starting work.</p>
        </div>
      </div>

      <div className="localized-quest-brief__body">
        <div className="localized-quest-brief__main">
          <h3>{brief.title}</h3>
          <p>{brief.summary}</p>
        </div>
        <div className="localized-quest-brief__next">
          <span>
            <Sparkles size={16} aria-hidden="true" />
            Next best action
          </span>
          <strong>{brief.nextStep}</strong>
        </div>
      </div>

      <ul className="localized-quest-brief__list">
        {brief.bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </section>
  );
}
