"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Palette, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PatternTrendAnalysisToolOutput } from "@/ai/flows/pattern-trend-analysis-tool";

export function PatternAnalysis() {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PatternTrendAnalysisToolOutput | null>(null);

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/pattern-trend-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sareePatternDescription: description }),
      });
      const data = await res.json();
      setResult(data ?? null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border bg-white shadow-sm">
      <CardHeader className="border-b border-border/50 pb-6">
        <CardTitle className="font-headline text-lg sm:text-2xl flex items-center gap-2 text-primary">
          <Palette className="h-5 w-5" />
          Pattern Consultant
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Expert pairing advice for your unique saree patterns.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleAnalysis} className="space-y-4 mb-8">
          <Textarea
            placeholder="Describe your saree... (e.g., Silk with floral embroidery)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
          />
          <Button type="submit" disabled={loading} className="w-full bg-secondary hover:bg-secondary/90 text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? "Consulting..." : "Get Suggestions"}
          </Button>
        </form>

        {result && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Matching Blouses</h4>
              <ul className="space-y-1">
                {result.blouseDesigns.map((design, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground items-start">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{design}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Accessory Palette</h4>
              <div className="flex flex-wrap gap-2">
                {result.accessoryColors.map((color, i) => (
                  <Badge key={i} variant="secondary" className="bg-accent text-primary border-primary/20">
                    {color}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
