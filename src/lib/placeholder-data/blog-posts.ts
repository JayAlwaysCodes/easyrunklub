// Placeholder blog data — shaped so a future admin authoring feature can
// populate this from the database instead of this hardcoded array. Both
// the homepage preview and the full blog pages read from this one file.

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  author: {
    name: string;
    email: string;
  };
  keyTakeaways: string[];
  body: string[]; // each entry is one paragraph
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "post-1",
    title: "The Lifelong Strides: What Running Teaches Us About Lifelong Pacing",
    excerpt:
    "What running with a community can teach you about pacing yourself through everything else in life.",
    image: "/blog/blog-1.jpg",
    author: { name: "Easy Admin", email: "EasyRunKlub@gmail.com" },
    keyTakeaways: [
    "Pacing is a lifelong strategy that prevents early burnout in both fitness and your personal career.",
    "Surrounding yourself with a community provides an invisible pull that makes consistency feel effortless.",
    "Slowing down your collective speed is often the fastest way to build sustainable endurance.",
    ],
    body: [
    "When you join a running club, the first major lesson you learn isn’t how to sprint across a finish line, but how to manage your energy over long distances. It is easy to let adrenaline take over in the opening minutes, pushing your body to a speed that feels exhilarating but is entirely unsustainable. True endurance runner communities know that the magic lies in finding a rhythm you can maintain for miles, a principle that applies directly to the way we manage our daily workloads and life goals.",
    "Running alongside others shifts your focus away from individual exhaustion and anchors you to a collective momentum. This social synergy acts as an emotional buffer against the temptation to quit when your lungs start to burn. By aligning your cadence with a group, you subconsciously learn that life is a collaborative marathon rather than a lonely sprint, teaching you to accept support, share your struggles, and protect your long-term energy reservoirs.",
    ],
    },
    {
    slug: "post-2",
    title: "The Neurochemistry of the Runner’s High",
    excerpt:
    "Discover how a simple, consistent jogging routine can rewire your brain to rapidly dissolve stress and corporate burnout.",
    image: "/blog/blog-2.jpg",
    author: { name: "Easy Admin", email: "EasyRunKlub@gmail.com" },
    keyTakeaways: [
    "Aerobic running triggers endocannabinoids that actively calm the brain's overstimulated stress centers.",
    "Cardio promotes neuroplasticity, helping to physically expand the brain regions linked to memory and focus.",
    "Trading the isolation of a desk for a group run acts as a biological reset button for mental fatigue.",
    ],
    body: [
    "For decades, people assumed that the peaceful euphoria experienced during a long run was purely due to an endorphin rush. Modern neuroscience reveals a much more fascinating truth: running actually floods your system with endocannabinoids, which are organic, self-produced molecules that easily cross the blood-brain barrier to alleviate anxiety. This chemical shift acts as a natural shield against the constant digital noise and daily pressures of modern work culture.",
    "Beyond immediate mood elevation, regular aerobic movement structurally changes your cognitive framework. It accelerates the growth of new blood vessels in the brain and stimulates the hippocampus, directly sharpening your long-term memory and spatial navigation skills. Stepping out onto the pavement isn't just about physical fitness; it is a vital mental reset that keeps your brain adaptable, sharp, and highly resilient under pressure.",
    ],
    },
    {
    slug: "post-3",
    title: "Debunking the 'Bad Knees' Myth",
    excerpt:
    "Why modern sports science proves that regular running actually strengthens your joints instead of wearing them down.",
    image: "/blog/blog-3.jpg",
    author: { name: "Easy Admin", email: "EasyRunKlub@gmail.com" },
    keyTakeaways: [
    "Scientific studies show that recreational runners have lower rates of knee arthritis than sedentary people.",
    "The progressive impact of running stimulates nutrient flow to cartilage and increases bone density.",
    "Gradual mileage increases allow the body's structural joints to safely adapt and become highly resilient.",
    ],
    body: [
    "One of the most persistent myths in fitness is that running will inevitably destroy your joints and lead to severe arthritis. However, large-scale medical studies consistently show that recreational runners have a significantly lower risk of hip and knee issues compared to their sedentary peers. The human skeleton is dynamic, meaning it doesn't simply wear down like car tires; instead, it actively remodels and strengthens itself when subjected to regular, structured stress.",
    "Every time your foot hits the ground, the impact forces nutrient-rich fluid into your joint cartilage, keeping it lubricated, thick, and healthy. Furthermore, running increases bone mineral density, protecting you against age-related bone thinning and structural frailty. By building mileage slowly and listening to your body, you aren't wearing your knees out—you are actively bulletproofing your legs for decades to come.",
    ],
},


];