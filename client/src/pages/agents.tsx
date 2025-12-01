import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin, Star, Shield } from 'lucide-react';
import { AgentContactDialog } from '@/components/agent-contact-dialog';
import agentsData from '@/data/agents.json';

export default function Agents() {
  const [search, setSearch] = useState('');
  const [specialty, setSpecialty] = useState('all');
  const agents = agentsData as any[];

  const specialties = useMemo(() => {
    const specs = new Set<string>();
    agents.forEach(a => a.specialties.forEach((s: string) => specs.add(s)));
    return Array.from(specs);
  }, []);

  const filtered = useMemo(() => {
    let result = agents;
    if (search) {
      result = result.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.location.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (specialty !== 'all') {
      result = result.filter(a => a.specialties.includes(specialty));
    }
    return result.sort((a, b) => b.rating - a.rating);
  }, [search, specialty]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="bg-gradient-to-r from-primary to-secondary text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Find an Agent</h1>
          <p className="text-white/90">Browse trusted agents in your area</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <h3 className="font-bold text-lg mb-6">Filters</h3>

              <div className="space-y-4">
                <div>
                  <label className="font-semibold text-sm mb-2 block">Search</label>
                  <Input
                    placeholder="Name or location..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div>
                  <label className="font-semibold text-sm mb-2 block">Specialty</label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="all">All Specialties</option>
                    {specialties.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <p className="text-muted-foreground mb-6">{filtered.length} agents found</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filtered.map(agent => (
                <Card key={agent.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex gap-4 mb-4">
                    <img
                      src={agent.photo_url}
                      alt={agent.name}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">{agent.name}</h3>
                        {agent.verified && <Shield className="h-4 w-4 text-green-600" />}
                      </div>
                      <div className="flex items-center gap-2 text-yellow-500 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.round(agent.rating) ? 'fill-yellow-400' : ''}`} />
                        ))}
                        <span className="text-xs text-gray-600">({agent.rating})</span>
                      </div>
                      <p className="text-sm text-gray-600">{agent.total_sales} sales</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-4">{agent.bio}</p>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="h-4 w-4" /> {agent.location}
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="h-4 w-4" /> {agent.email}
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4" /> {agent.phone}
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    {agent.specialties.slice(0, 2).map((s: string) => (
                      <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {s}
                      </span>
                    ))}
                  </div>

                  <AgentContactDialog agent={agent} />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
