import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Portfolio from "@/components/Portfolio";
import { projectMedia, type Project } from "@/lib/projects";

const project = (i: number, featured: boolean, extra: Partial<Project> = {}): Project => ({
  id: String(i),
  title: `Project ${i}`,
  slug: `project-${i}`,
  category: i % 2 ? "game" : "vr",
  short_description: "Short",
  full_description: `Full story ${i}`,
  cover_image_url: `/uploads/${i}.jpg`,
  gallery_images: [`/uploads/${i}-a.jpg`],
  tools_used: ["Unity"],
  video_url: null,
  video_urls: null,
  project_link: null,
  featured,
  display_order: i,
  created_at: "",
  updated_at: "",
  ...extra,
});

const tables: Record<string, unknown[]> = {
  projects: [
    project(1, true, { video_url: "https://youtu.be/abc", video_urls: ["https://vimeo.com/1"] }),
    project(2, true),
    project(3, false),
    project(4, false),
  ],
  project_categories: [
    { id: "a", slug: "vr", name: "VR" },
    { id: "b", slug: "game", name: "Games" },
  ],
};

vi.mock("@/integrations/cpanel/client", () => ({
  cms: {
    from: (table: string) => {
      const query = {
        select: () => query,
        order: () => query,
        then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data: tables[table], error: null }).then(resolve),
      };
      return query;
    },
  },
}));

afterEach(cleanup);

// jsdom has no IntersectionObserver; framer-motion's whileInView needs one.
class StubObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
vi.stubGlobal("IntersectionObserver", StubObserver);

describe("Selected Works", () => {
  it("shows only featured projects with a link to all projects", async () => {
    render(<MemoryRouter><Portfolio /></MemoryRouter>);
    expect(await screen.findByRole("button", { name: "Open Project 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Project 2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open Project 3" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View all projects \(4\)/ })).toHaveAttribute("href", "/projects");
    expect(screen.getAllByText("Games").length).toBeGreaterThan(0);
  });

  it("opens a popup with the description and a video/image slider", async () => {
    render(<MemoryRouter><Portfolio /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Open Project 1" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Full story 1")).toBeInTheDocument();
    expect(within(dialog).getByTitle("Project 1 — video")).toHaveAttribute("src", "https://www.youtube.com/embed/abc");
    expect(within(dialog).getByText("1/4")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Next slide" }));
    expect(within(dialog).getByTitle("Project 1 — video")).toHaveAttribute("src", "https://player.vimeo.com/video/1");
  });

  it("orders media as videos first, then unique images", () => {
    const media = projectMedia(project(9, false, { video_url: "v1", video_urls: ["v2"], gallery_images: ["/uploads/9.jpg", "g"] }));
    expect(media.map((m) => `${m.type}:${m.src}`)).toEqual(["video:v1", "video:v2", "image:/uploads/9.jpg", "image:g"]);
  });
});
