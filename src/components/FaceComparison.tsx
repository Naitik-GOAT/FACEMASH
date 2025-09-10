import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSessionId } from '@/hooks/useSessionId';
import { useEloRating } from '@/hooks/useEloRating';
import { useToast } from '@/hooks/use-toast';
import FaceCard from './FaceCard';
import { Button } from './ui/button';
import { RotateCcw } from 'lucide-react';

interface Person {
  id: string;
  name: string;
  photo_url: string;
  rating: number;
  wins: number;
  losses: number;
  total_votes: number;
}

const FaceComparison = () => {
  const [people, setPeople] = useState<[Person, Person] | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const sessionId = useSessionId();
  const { calculateEloRating } = useEloRating();
  const { toast } = useToast();

  const fetchRandomPeople = async () => {
    try {
      setLoading(true);
      setWinner(null);
      
      // Get two random approved people
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('is_approved', true)
        .limit(50); // Get more to randomly select from
      
      if (error) throw error;
      
      if (!data || data.length < 2) {
        toast({
          title: "Not enough people",
          description: "We need at least 2 approved people to start comparing!",
          variant: "destructive"
        });
        return;
      }
      
      // Randomly select 2 different people
      const shuffled = [...data].sort(() => 0.5 - Math.random());
      const selectedPeople: [Person, Person] = [shuffled[0], shuffled[1]];
      
      // Removed spam protection - allow multiple votes per session
      
      setPeople(selectedPeople);
    } catch (error) {
      console.error('Error fetching people:', error);
      toast({
        title: "Error",
        description: "Failed to load people for comparison",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (winnerId: string) => {
    if (!people || !sessionId || voting) return;
    
    setVoting(true);
    setWinner(winnerId);
    
    try {
      const winnerPerson = people.find(p => p.id === winnerId);
      const loserPerson = people.find(p => p.id !== winnerId);
      
      if (!winnerPerson || !loserPerson) return;
      
      // Calculate new ratings
      const { newWinnerRating, newLoserRating, ratingChange } = calculateEloRating(
        winnerPerson.rating,
        loserPerson.rating
      );
      
      // Record the vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert({
          session_id: sessionId,
          person1_id: people[0].id,
          person2_id: people[1].id,
          winner_id: winnerId,
          rating_change: ratingChange
        });
      
      if (voteError) throw voteError;
      
      // Update ratings - fallback to individual updates since RPC might not exist
      await Promise.all([
        supabase
          .from('people')
          .update({ 
            rating: newWinnerRating,
            wins: winnerPerson.wins + 1,
            total_votes: winnerPerson.total_votes + 1
          })
          .eq('id', winnerId),
        supabase
          .from('people')
          .update({ 
            rating: newLoserRating,
            losses: loserPerson.losses + 1,
            total_votes: loserPerson.total_votes + 1
          })
          .eq('id', loserPerson.id)
      ]);
      
      toast({
        title: "Vote recorded!",
        description: `${winnerPerson.name} gained ${ratingChange} points!`,
      });
      
      // Wait for animation then load new people
      setTimeout(() => {
        fetchRandomPeople();
      }, 1500);
      
    } catch (error) {
      console.error('Error recording vote:', error);
      toast({
        title: "Error",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive"
      });
      setVoting(false);
      setWinner(null);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchRandomPeople();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading faces to compare...</p>
        </div>
      </div>
    );
  }

  if (!people) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-xl mb-4">No people available for comparison</p>
          <Button onClick={fetchRandomPeople}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Who looks better?</h1>
        <p className="text-muted-foreground">Click on the person you think looks better</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
        {people.map((person) => (
          <div key={person.id} className="animate-fade-in">
            <FaceCard
              person={person}
              onClick={() => handleVote(person.id)}
              isWinner={winner === person.id}
              disabled={voting}
            />
          </div>
        ))}
      </div>

      <div className="text-center">
        <Button
          variant="outline"
          onClick={fetchRandomPeople}
          disabled={voting}
          className="gap-2"
        >
          <RotateCcw size={16} />
          Skip This Matchup
        </Button>
      </div>
    </div>
  );
};

export default FaceComparison;