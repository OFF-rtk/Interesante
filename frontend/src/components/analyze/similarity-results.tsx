"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Eye, ExternalLink, Info } from "lucide-react";

interface SimilarityMatch {
  id: string;
  title: string;
  thumbnail: string;
  platform: string;
  similarityScore: number;
  matchType: "visual" | "audio" | "both";
  url: string;
  uploadDate: string;
  duration: string;
}

interface SimilarityResultsProps {
  videoTitle?: string;
  overallScore: number;
  matches: SimilarityMatch[];
  onViewDetails?: (matchId: string) => void;
}

export function SimilarityResults({
  videoTitle = "Your Video",
  overallScore,
  matches,
  onViewDetails
}: SimilarityResultsProps) {
  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: "High", color: "destructive", icon: AlertTriangle };
    if (score >= 50) return { level: "Medium", color: "orange", icon: Info };
    return { level: "Low", color: "green", icon: CheckCircle };
  };

  const risk = getRiskLevel(overallScore);
  const RiskIcon = risk.icon;

  const getMatchTypeBadge = (type: SimilarityMatch["matchType"]) => {
    switch (type) {
      case "visual":
        return <Badge variant="secondary">Visual</Badge>;
      case "audio":
        return <Badge variant="outline">Audio</Badge>;
      case "both":
        return <Badge variant="default">Visual + Audio</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-red-600";
    if (score >= 50) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Overall Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RiskIcon className={`h-5 w-5 ${risk.color === 'destructive' ? 'text-red-500' : risk.color === 'orange' ? 'text-orange-500' : 'text-green-500'}`} />
                Similarity Analysis Complete
              </CardTitle>
              <CardDescription>
                Analysis for: {videoTitle}
              </CardDescription>
            </div>
            <Badge 
              variant={risk.color === 'destructive' ? 'destructive' : 'secondary'}
              className="text-lg px-4 py-2"
            >
              {risk.level} Risk
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Similarity Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}%
                </span>
              </div>
              <Progress value={overallScore} className="w-full" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">{matches.length}</p>
                <p className="text-sm text-muted-foreground">Similar Videos Found</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {matches.filter(m => m.similarityScore >= 80).length}
                </p>
                <p className="text-sm text-muted-foreground">High Similarity</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {matches.filter(m => m.matchType === 'both').length}
                </p>
                <p className="text-sm text-muted-foreground">Full Matches</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Matches */}
      {matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Similar Content Found ({matches.length})</CardTitle>
            <CardDescription>
              Review these matches to understand potential similarity concerns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {matches.map((match) => (
                <div key={match.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-24 h-16 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      <Eye className="h-6 w-6 text-muted-foreground" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{match.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {match.platform} • {match.duration} • {match.uploadDate}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {getMatchTypeBadge(match.matchType)}
                          <span className={`text-lg font-bold ${getScoreColor(match.similarityScore)}`}>
                            {match.similarityScore}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDetails?.(match.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(match.url, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Original
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Matches */}
      {matches.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Similar Content Found</h3>
            <p className="text-muted-foreground mb-6">
              Your content appears to be original with no significant similarities detected.
            </p>
            <Button>Generate Certificate</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
