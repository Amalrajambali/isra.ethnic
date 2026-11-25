"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Loader2, Shirt } from "lucide-react";
import type { RecommendDrapeOutput } from "@/ai/flows/ai-personal-drape-tool";

export function DrapeTool() {
  const [occasion, setOccasion] = useState("");
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendDrapeOutput['recommendations'] | null>(null);

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!occasion.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/recommend-drape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ occasion }),
      });
      const result = await res.json();
      setRecommendations(result.recommendations ?? null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border bg-white shadow-sm overflow-hidden">
      <CardHeader className="border-b border-border/50 pb-6">
        <CardTitle className="font-headline text-lg sm:text-2xl flex items-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" />
          AI Style Advisor
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Personalized recommendations for your special occasions.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleRecommend} className="space-y-4 mb-8">
          <div className="flex gap-2">
            <Input
              placeholder="Where are you headed? (e.g. Wedding, Brunch)"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Stylize"}
            </Button>
          </div>
        </form>

        {recommendations && (
          <div className="space-y-4 animate-fade-in">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-accent/30 border border-primary/10">
                <div className="flex items-center gap-2 mb-2">
                  <Shirt className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm uppercase tracking-wider text-primary">{rec.type}</span>
                </div>
                <h4 className="font-headline text-lg mb-1">{rec.recommendation}</h4>
                <p className="text-sm text-muted-foreground italic">{rec.reason}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
