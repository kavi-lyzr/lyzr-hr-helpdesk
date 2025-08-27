import { Button } from "@/components/ui/button";

export default function DesignGuidelines() {
    return (
        <div className="flex flex-col gap-4 p-4 w-1/8">
            <h1 className="text-2xl font-bold">Design Guidelines</h1>
            <Button>Click me</Button>
            <Button variant="outline">Click me</Button>
            <Button variant="secondary">Click me</Button>
            <Button variant="destructive">Click me</Button>
            <Button variant="ghost">Click me</Button>
            <Button variant="link">Click me</Button>
        </div>
    );
}


