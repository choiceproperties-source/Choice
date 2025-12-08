export interface PropertyReview {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
  avatarInitial: string;
}

export interface PropertyReviewsData {
  averageRating: number;
  totalReviews: number;
  reviews: PropertyReview[];
}

const mockReviewsDataset: PropertyReview[] = [
  {
    id: "1",
    name: "Sarah M.",
    rating: 5,
    date: "November 2024",
    comment: "Wonderful location with friendly neighbors. The property was even cleaner than the photos showed. My family has already fallen in love with this place!",
    avatarInitial: "S",
  },
  {
    id: "2",
    name: "Jonathan K.",
    rating: 4,
    date: "October 2024",
    comment: "Great area and the landlord responds to maintenance requests quickly. Only minor issue was the parking situation on weekends, but it's manageable.",
    avatarInitial: "J",
  },
  {
    id: "3",
    name: "Maria L.",
    rating: 5,
    date: "September 2024",
    comment: "Spacious rooms and natural light throughout. The community is quiet and peaceful. Highly recommend to anyone looking for a comfortable home.",
    avatarInitial: "M",
  },
  {
    id: "4",
    name: "David R.",
    rating: 4,
    date: "August 2024",
    comment: "Good value for the price. Close to public transit and grocery stores. WiFi could be stronger, but everything else is solid.",
    avatarInitial: "D",
  },
  {
    id: "5",
    name: "Elena T.",
    rating: 5,
    date: "July 2024",
    comment: "Exceeded my expectations! Beautiful finishes, well-maintained common areas, and the staff is very helpful. Would definitely rent here again.",
    avatarInitial: "E",
  },
  {
    id: "6",
    name: "Michael P.",
    rating: 3,
    date: "June 2024",
    comment: "Decent location but the unit needed some updating when I moved in. Management eventually fixed the issues, though it took a few weeks.",
    avatarInitial: "M",
  },
  {
    id: "7",
    name: "Ashley N.",
    rating: 5,
    date: "May 2024",
    comment: "Perfect for my situation. Landlord was transparent about everything upfront. The neighborhood has great restaurants and parks nearby.",
    avatarInitial: "A",
  },
];

export function usePropertyReviews(): PropertyReviewsData {
  // Calculate average rating
  const totalRating = mockReviewsDataset.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = Math.round((totalRating / mockReviewsDataset.length) * 10) / 10;

  return {
    averageRating,
    totalReviews: mockReviewsDataset.length,
    reviews: mockReviewsDataset,
  };
}
