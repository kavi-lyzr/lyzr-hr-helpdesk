import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Bot, Upload, Search, Eye, Download, Trash2, Settings } from 'lucide-react';

const documents = [
  {
    id: 1,
    name: 'Employee Handbook',
    type: 'PDF',
    size: '2.5 MB',
    uploadedBy: 'Admin',
    uploadedAt: '2025-08-20',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Leave Policy',
    type: 'PDF',
    size: '500 KB',
    uploadedBy: 'Admin',
    uploadedAt: '2025-08-15',
    status: 'Active',
  },
];

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
        <p className="text-muted-foreground">Manage knowledge base and AI system configuration</p>
      </div>

      <Tabs defaultValue="knowledge-base">
        <TabsList>
          <TabsTrigger value="knowledge-base"><FileText className="mr-2 h-4 w-4" /> Knowledge Base</TabsTrigger>
          <TabsTrigger value="configuration"><Bot className="mr-2 h-4 w-4" /> AI Configuration</TabsTrigger>
        </TabsList>
        <TabsContent value="knowledge-base">
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-600">Drag and drop files here, or <Button variant="link" className="p-0">browse</Button></p>
                <p className="text-sm text-gray-500">Supported formats: PDF only (Max size: 10MB)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="mt-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Documents</CardTitle>
                <div className="relative max-w-md flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input placeholder="Search documents..." className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Uploaded At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{doc.size}</TableCell>
                      <TableCell>{doc.uploadedBy}</TableCell>
                      <TableCell>{doc.uploadedAt}</TableCell>
                      <TableCell>{doc.status}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>System Instructions</CardTitle>
              <p className="text-sm text-muted-foreground">Configure how the AI assistant behaves and responds to user queries.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                rows={12}
                placeholder="Enter system instructions for the AI assistant..."
                defaultValue={`You are an HR assistant for the company. You help employees with HR-related questions and provide accurate information based on the company's policies and documents.\n\nGuidelines:\n- Be professional and helpful\n- Provide accurate information based on available documents\n- Direct users to appropriate resources when needed\n- Escalate complex issues to human HR representatives`}
              />
              <div className="flex justify-end">
                <Button><Settings className="mr-2 h-4 w-4" /> Save Configuration</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}