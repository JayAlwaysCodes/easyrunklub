// Placeholder gallery data — shaped so a future admin/user upload feature
// (with admin approval) can populate this from the database instead of
// this hardcoded array. `status` anticipates the approval workflow:
// only "approved" items would ever be queried for public display once
// that backend exists. `type` anticipates video items alongside images.

export type GalleryItem = {
  id: string;
  type: "image" | "video";
  src: string;
  status: "approved" | "pending";
};

export const GALLERY_ITEMS: GalleryItem[] = Array.from(
  { length: 19 },
  (_, index) => {
    const num = index + 1;
    const extension = num >= 7 && num <= 9 ? "jpg" : "jpeg";
    return {
      id: String(num),
      type: "image" as const,
      src: `/gallery/gallery-${num}.${extension}`,
      status: "approved" as const,
    };
  }
);