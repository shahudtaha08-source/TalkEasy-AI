import { useParams, Link } from "wouter";
import { ArrowLeft, Clock, Book, Heart, BrainCircuit, Coffee, Moon, Zap, Shield, Flame, Star } from "lucide-react";
import { ARTICLES } from "./Resources";

const ICON_MAP: Record<string, any> = {
  Flame,
  Zap,
  Moon,
  Heart,
  Coffee,
  BrainCircuit,
  Shield,
  Star,
};

export default function ResourceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const article = ARTICLES.find((a: any) => a.slug === slug);

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Article not found</h1>
        <Link href="/resources" className="text-indigo-600 hover:underline">
          ← Back to Resources
        </Link>
      </div>
    );
  }

  const Icon = ICON_MAP[article.icon.name] || Book;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <Link href="/resources" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Resources
      </Link>

      <header>
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-10 h-10 rounded-xl ${article.bg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${article.color}`} />
          </div>
          <span className={`text-sm font-bold uppercase tracking-wider ${article.color}`}>
            {article.category}
          </span>
        </div>
        <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white leading-tight">
          {article.title}
        </h1>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
          <Clock className="w-4 h-4" />
          {article.readTime} read
        </div>
      </header>

      {/* Content */}
      <div className="glass-card rounded-3xl p-8 prose prose-lg dark:prose-invert max-w-none">
        <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed">
          {article.content}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 text-sm text-amber-700 dark:text-amber-300">
        <p className="font-semibold mb-1">Important Disclaimer</p>
        <p>This article is for educational purposes only. TalkEasy does not diagnose mental illness or replace licensed professionals. If you're experiencing a mental health crisis, please seek immediate professional help or call emergency services (112).</p>
      </div>

      {/* Back to Resources */}
      <div className="text-center">
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
        >
          <Book className="w-4 h-4" /> Back to All Resources
        </Link>
      </div>
    </div>
  );
}
