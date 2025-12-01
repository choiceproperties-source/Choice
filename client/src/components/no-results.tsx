import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Search, ArrowRight } from "lucide-react";

interface NoResultsProps {
  onReset?: () => void;
}

export function NoResults({ onReset }: NoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <Search className="h-16 w-16 text-gray-300 mb-6" />
      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Properties Found</h3>
      <p className="text-gray-600 text-center max-w-md mb-8">
        We couldn't find any properties matching your search criteria. Try adjusting your filters or browse all available properties.
      </p>
      <div className="flex gap-4">
        {onReset && (
          <Button
            variant="outline"
            onClick={onReset}
            className="border-primary text-primary hover:bg-primary/5"
          >
            Clear Filters
          </Button>
        )}
        <Link href="/properties">
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            Browse All <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
