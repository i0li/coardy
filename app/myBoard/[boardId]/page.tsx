import { Canvas } from "./_components/canvas";
import CanvasProvider from "@/context/canvas-context";

interface BoardIdPageProps {
  params: {
    boardId: string;
  };
}

const BoardIdPage = ({ params }: BoardIdPageProps) => {
  return (
    <CanvasProvider>
      <Canvas boardId={params.boardId} />
    </CanvasProvider>
  );
};

export default BoardIdPage;
