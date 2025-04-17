import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function DemoCard({ title, image, page }) {
  const navigate = useNavigate();

  const openDemo = (mode) => {
    navigate(`/${page}?mode=${mode}`);
  };

  return (
    <div className="demo-card flex flex-col items-center gap-2">
      <div className="text-lg font-semibold">{title}</div>
      <div className="w-[400px] h-[320px] rounded-md overflow-hidden flex justify-center items-center">
        <img
          src={image}
          alt={title}
          className="w-full h-auto"
          style={{ objectFit: "contain" }}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <Button
          variant="theme-toggle"
          className="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
          onClick={() => openDemo(0)}
        >
          普通加载
        </Button>
        <Button
          variant="theme-toggle"
          className="!bg-background/80 !border !border-input/80 !shadow-sm hover:!bg-accent/30 dark:hover:!bg-accent/20 !text-foreground"
          onClick={() => openDemo(1)}
        >
          高质量加载
        </Button>
      </div>
    </div>
  );
}
