import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PropertyCard } from "@/components/property-card";
import { Breadcrumb } from "@/components/breadcrumb";
import { NoResults } from "@/components/no-results";
import { PropertyQuickView } from "@/components/property-quick-view";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import MapView from "@/components/map-view";
import { useProperties } from "@/hooks/use-properties";
import type { Property } from "@/lib/types";
import { Search, Bookmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateMetaTags } from "@/lib/seo";

export default function Properties() {
  const { properties: allProperties, loading } = useProperties();
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(allProperties);

  useEffect(() => {
    updateMetaTags({
      title: "Browse Rental Properties - Choice Properties",
      description: "Search and browse available rental properties. Filter by price, bedrooms, and property type."
    });
  }, []);
  const [sortBy, setSortBy] = useState("featured");
  const [quickViewProperty, setQuickViewProperty] = useState<Property | null>(null);

  useEffect(() => {
    setFilteredProperties(allProperties);
  }, [allProperties]);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const { toast } = useToast();
  
  // Filters
  const [search, setSearch] = useState("");
  const [priceMin, setPriceMin] = useState("any");
  const [bedrooms, setBedrooms] = useState("any");
  const [homeType, setHomeType] = useState("any");
  const [savedSearches, setSavedSearches] = useState<Array<{search: string; priceMin: string; bedrooms: string; homeType: string}>>(
    JSON.parse(localStorage.getItem("choiceProperties_savedSearches") || "[]")
  );

  const handleSaveSearch = () => {
    const newSearch = { search, priceMin, bedrooms, homeType };
    const updated = [...savedSearches, newSearch];
    localStorage.setItem("choiceProperties_savedSearches", JSON.stringify(updated));
    setSavedSearches(updated);
    toast({
      title: "Search Saved",
      description: "Your search criteria has been saved for future reference."
    });
  };

  useEffect(() => {
    let result = allProperties;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(query) || 
        p.address.toLowerCase().includes(query) ||
        (p.city?.toLowerCase().includes(query) || false)
      );
    }

    if (priceMin !== "any") {
      const minVal = parseInt(priceMin);
      result = result.filter(p => p.price ? parseInt(p.price) >= minVal : false);
    }

    if (bedrooms !== "any") {
      const minBeds = parseInt(bedrooms);
      result = result.filter(p => (p.bedrooms || 0) >= minBeds);
    }

    if (homeType !== "any") {
        result = result.filter(p => p.property_type?.toLowerCase() === homeType.toLowerCase());
    }

    // Apply sorting
    if (sortBy === "price-low") {
      result = [...result].sort((a, b) => (parseInt(a.price || "0") || 0) - (parseInt(b.price || "0") || 0));
    } else if (sortBy === "price-high") {
      result = [...result].sort((a, b) => (parseInt(b.price || "0") || 0) - (parseInt(a.price || "0") || 0));
    } else if (sortBy === "newest") {
      result = [...result].reverse();
    }

    setFilteredProperties(result);
  }, [search, priceMin, bedrooms, homeType, sortBy, allProperties]);

  const saveSearch = () => {
    const newSearch = { search, priceMin, bedrooms, homeType };
    const isDuplicate = savedSearches.some(s => 
      s.search === search && s.priceMin === priceMin && s.bedrooms === bedrooms && s.homeType === homeType
    );
    
    if (!isDuplicate) {
      const updated = [...savedSearches, newSearch];
      setSavedSearches(updated);
      localStorage.setItem("choiceProperties_savedSearches", JSON.stringify(updated));
      toast({
        title: "Search Saved",
        description: "You can find this search in your saved searches."
      });
    } else {
      toast({
        title: "Already Saved",
        description: "This search is already in your saved searches.",
        variant: "default"
      });
    }
  };

  const loadSearch = (s: typeof savedSearches[0]) => {
    setSearch(s.search);
    setPriceMin(s.priceMin);
    setBedrooms(s.bedrooms);
    setHomeType(s.homeType);
  };

  const deleteSearch = (index: number) => {
    const updated = savedSearches.filter((_, i) => i !== index);
    setSavedSearches(updated);
    localStorage.setItem("choiceProperties_savedSearches", JSON.stringify(updated));
  };

  const resetFilters = () => {
    setSearch("");
    setPriceMin("any");
    setBedrooms("any");
    setHomeType("any");
    setSortBy("featured");
  };

  const handleQuickView = (property: Property) => {
    setQuickViewProperty(property);
    setIsQuickViewOpen(true);
  };

  // Use real map markers with actual property coordinates
  const mapMarkers = filteredProperties
    .filter(p => p.price && p.latitude && p.longitude) // Filter properties with coordinates
    .map((p) => {
      const lat = parseFloat(p.latitude || '34.0522');
      const lng = parseFloat(p.longitude || '-118.2437');
      const priceNum = typeof p.price === 'string' ? parseInt(p.price) : (p.price || 0);
      return {
          position: [lat, lng] as [number, number],
          title: `$${priceNum.toLocaleString()}`,
          description: p.address
      }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Breadcrumb items={[{ label: "Properties" }]} />
      
      {savedSearches.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-4 py-2 text-sm">
          <span className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            <strong>{savedSearches.length}</strong> saved search{savedSearches.length !== 1 ? 'es' : ''}
          </span>
        </div>
      )}
      
      {/* Zillow-style Subheader Filter Bar - Enhanced */}
      <div className="border-b bg-white dark:bg-gray-950 shadow-sm p-3 z-20 sticky top-0 transition-all duration-300">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full md:w-auto">
                <Input 
                  placeholder="Address, Neighborhood, or Zip" 
                  className="pl-3 pr-10 h-10 border-gray-300 dark:border-gray-700 focus:border-primary dark:bg-gray-800 dark:text-white" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-address"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-primary dark:text-blue-400 cursor-pointer" />
            </div>

            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <Select value={priceMin} onValueChange={setPriceMin}>
                    <SelectTrigger className={`w-[140px] h-10 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all duration-200 ${priceMin !== 'any' ? 'border-primary dark:border-blue-400 ring-2 ring-primary/20 dark:ring-blue-500/20' : ''}`} data-testid="select-price-min">
                        <SelectValue placeholder="Min Price" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="any">Any Price</SelectItem>
                        <SelectItem value="1000">$1,000+</SelectItem>
                        <SelectItem value="2000">$2,000+</SelectItem>
                        <SelectItem value="3000">$3,000+</SelectItem>
                        <SelectItem value="4000">$4,000+</SelectItem>
                        <SelectItem value="5000">$5,000+</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={bedrooms} onValueChange={setBedrooms}>
                    <SelectTrigger className={`w-[120px] h-10 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all duration-200 ${bedrooms !== 'any' ? 'border-primary dark:border-blue-400 ring-2 ring-primary/20 dark:ring-blue-500/20' : ''}`} data-testid="select-bedrooms">
                        <SelectValue placeholder="Beds" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="any">Any Beds</SelectItem>
                        <SelectItem value="1">1+ Bd</SelectItem>
                        <SelectItem value="2">2+ Bd</SelectItem>
                        <SelectItem value="3">3+ Bd</SelectItem>
                        <SelectItem value="4">4+ Bd</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={homeType} onValueChange={setHomeType}>
                    <SelectTrigger className={`w-[140px] h-10 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all duration-200 ${homeType !== 'any' ? 'border-primary dark:border-blue-400 ring-2 ring-primary/20 dark:ring-blue-500/20' : ''}`} data-testid="select-home-type">
                        <SelectValue placeholder="Home Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="any">Any Type</SelectItem>
                        <SelectItem value="House">Houses</SelectItem>
                        <SelectItem value="Apartment">Apartments</SelectItem>
                        <SelectItem value="Condo">Condos</SelectItem>
                        <SelectItem value="Townhome">Townhomes</SelectItem>
                    </SelectContent>
                </Select>
                
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[140px] h-10 border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white" data-testid="select-sort-by">
                        <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="featured">Featured</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  className="h-10 border-primary text-primary hover:bg-primary/5 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/20 flex items-center gap-2 transition-all duration-200" 
                  onClick={saveSearch}
                  data-testid="button-save-search"
                >
                  <Bookmark className="h-4 w-4" /> Save
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-10 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200" 
                  onClick={resetFilters}
                  data-testid="button-reset-filters"
                >
                  Clear
                </Button>
            </div>
        </div>
      </div>

      {/* Split Layout: Map (Right) & List (Left) */}
      <div className="flex-1 flex overflow-hidden relative">
         {/* Right Side Map (Mobile hidden or stacked) */}
         <div className="hidden lg:block w-1/2 h-full relative z-0">
             <MapView 
                center={[34.0522, -118.2437]} 
                zoom={12}
                markers={mapMarkers}
                className="h-full w-full rounded-none border-none"
             />
             {/* Floating pill buttons on map */}
             <div className="absolute top-4 left-4 z-[400] flex gap-2">
                 <Button variant="secondary" size="sm" className="shadow-md bg-white text-gray-800 hover:bg-gray-100">Draw</Button>
                 <Button variant="secondary" size="sm" className="shadow-md bg-white text-gray-800 hover:bg-gray-100">Satellite</Button>
             </div>
         </div>

         {/* Left Side List */}
         <div className="w-full lg:w-1/2 overflow-y-auto p-4 shadow-2xl z-10 bg-white dark:bg-gray-950 border-l dark:border-gray-800">
             <div className="flex justify-between items-center mb-4 px-2">
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white">Real Estate & Homes For Rent</h2>
                 <span className="text-gray-500 dark:text-gray-400 text-sm font-semibold bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full" data-testid="text-results-count">{filteredProperties.length} results</span>
             </div>
             
             {savedSearches.length > 0 && (
               <div className="mb-4 border-b pb-3">
                 <p className="text-xs font-semibold text-gray-600 mb-2">SAVED SEARCHES</p>
                 <div className="flex gap-2 flex-wrap">
                   {savedSearches.map((s, idx) => (
                     <div key={idx} className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs">
                       <span className="text-gray-700">{s.search || "All"}</span>
                       <button 
                         onClick={() => loadSearch(s)}
                         className="text-blue-600 hover:text-blue-800 font-semibold"
                       >Load</button>
                       <button 
                         onClick={() => deleteSearch(idx)}
                         className="text-red-500 hover:text-red-700 ml-1"
                       >×</button>
                     </div>
                   ))}
                 </div>
               </div>
             )}
             
             <div className="mb-4 flex gap-2 px-2 transition-all duration-300">
                 <span className="text-sm font-semibold text-primary dark:text-blue-400 border-b-2 border-primary dark:border-blue-400 cursor-pointer pb-1 hover:text-primary/80 dark:hover:text-blue-300 transition-colors duration-200" data-testid="tab-agent-listings">Agent Listings</span>
                 <span className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 cursor-pointer pb-1 transition-colors duration-200" data-testid="tab-other-listings">Other Listings</span>
             </div>

             {filteredProperties.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} onQuickView={handleQuickView} />
                    ))}
                </div>
             ) : (
                <NoResults onReset={resetFilters} />
             )}
             
             <div className="mt-8 text-center text-xs text-gray-400 dark:text-gray-600 py-4 border-t dark:border-gray-800">
                 Choice Properties Inc. | Updated every 5 minutes.
             </div>
         </div>
      </div>

      <PropertyQuickView 
        property={quickViewProperty} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
      />
      <Footer />
    </div>
  );
}
