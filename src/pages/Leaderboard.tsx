import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award } from 'lucide-react';

interface Person {
  id: string;
  name: string;
  photo_url: string;
  rating: number;
  total_votes: number;
  wins: number;
  losses: number;
}

import Navigation from "@/components/Navigation";

const Leaderboard = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('is_approved', true)
        .order('rating', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPeople(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    // Set up real-time subscription for people updates
    const channel = supabase
      .channel('people-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'people'
      }, () => {
        // Refresh leaderboard when any person data changes
        fetchLeaderboard();
      })
      .subscribe();
    
    // Refresh leaderboard when window gains focus
    const handleFocus = () => {
      fetchLeaderboard();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="text-yellow-500" size={24} />;
      case 1:
        return <Medal className="text-gray-400" size={24} />;
      case 2:
        return <Award className="text-amber-600" size={24} />;
      default:
        return <span className="text-xl font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    return total > 0 ? ((wins / total) * 100).toFixed(1) : '0.0';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
            <p className="text-muted-foreground">Top ranked faces based on Elo ratings</p>
          </div>

          <div className="max-w-4xl mx-auto">
            {people.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl text-muted-foreground">No people in the leaderboard yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {people.map((person, index) => (
                  <div
                    key={person.id}
                    className={`leaderboard-item flex items-center gap-4 ${
                      index < 3 ? 'border-primary/20' : ''
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center justify-center w-12 h-12">
                      {getRankIcon(index)}
                    </div>

                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
                      <img
                        src={person.photo_url}
                        alt={person.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&size=64&background=random`;
                        }}
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{person.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Rating: <span className="font-semibold text-primary">{person.rating}</span></span>
                        <span>Votes: {person.total_votes}</span>
                        <span>Win Rate: {getWinRate(person.wins, person.losses)}%</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{person.rating}</div>
                      <div className="text-sm text-muted-foreground">
                        {person.wins}W - {person.losses}L
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;