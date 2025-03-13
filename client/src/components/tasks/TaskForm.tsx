import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, CalendarIcon, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import TaskTags from "./TaskTags";

const priorityOptions = [
  { value: "high", label: "Alta" },
  { value: "medium", label: "Média" },
  { value: "low", label: "Baixa" },
];

const statusOptions = [
  { value: "todo", label: "A fazer" },
  { value: "in_progress", label: "Em andamento" },
  { value: "review", label: "Em revisão" },
  { value: "completed", label: "Concluído" },
];

// Form schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }).max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["todo", "in_progress", "review", "completed"]),
  projectId: z.number().min(1, { message: "Selecione um projeto" }),
  phaseId: z.number().optional().nullable(),
  assignedTo: z.number().optional().nullable(),
  dueDate: z.date().optional(),
});

export type TaskFormValues = z.infer<typeof formSchema>;

interface TaskFormProps {
  defaultValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => void;
  projectId?: number;
  isLoading?: boolean;
}

export function TaskForm({ defaultValues, onSubmit, projectId, isLoading = false }: TaskFormProps) {
  // Estado para as tags
  const [tags, setTags] = useState<string[]>([]);
  
  // Initialize the form with default values
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      priority: defaultValues?.priority || "medium",
      status: defaultValues?.status || "todo",
      projectId: defaultValues?.projectId || projectId || 0,
      phaseId: defaultValues?.phaseId || null,
      assignedTo: defaultValues?.assignedTo || null,
      dueDate: defaultValues?.dueDate,
    },
  });
  
  // Função customizada de submissão para incluir as tags
  const handleSubmit = (values: TaskFormValues) => {
    // Em um ambiente de produção, você enviaria as tags junto com os valores
    // Para a demo, vamos apenas mostrar como seria a integração
    console.log("Tags selecionadas:", tags);
    
    // Chamar a função onSubmit original
    onSubmit(values);
  };

  // Fetch all projects
  const { data: projectsData } = useQuery({
    queryKey: ["/api/projects"],
    enabled: true,
  });
  
  // Garantir que projects seja sempre um array, mesmo que a query ainda não tenha retornado
  const projects = Array.isArray(projectsData) ? projectsData : [];

  // Fetch phases for the current project
  const { data: phasesData } = useQuery({
    queryKey: [`/api/projects/${form.getValues().projectId}/phases`],
    enabled: !!form.getValues().projectId,
  });
  
  // Garantir que phases seja sempre um array, mesmo que a query ainda não tenha retornado
  const phases = Array.isArray(phasesData) ? phasesData : [];

  // Fetch team members
  const { data: usersData } = useQuery({
    queryKey: ["/api/users"],
    enabled: true,
  });
  
  // Garantir que users seja sempre um array, mesmo que a query ainda não tenha retornado
  const users = Array.isArray(usersData) ? usersData : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Tarefa</FormLabel>
              <FormControl>
                <Input placeholder="Digite o nome da tarefa" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva os detalhes da tarefa"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {projects && projects.length > 0 && (
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Projeto</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value ? field.value.toString() : ""}
                  disabled={isLoading || !!projectId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map((project: any) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prioridade</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phases && phases.length > 0 && (
            <FormField
              control={form.control}
              name="phaseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fase</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fase" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {phases.map((phase: any) => (
                        <SelectItem key={phase.id} value={phase.id.toString()}>
                          {phase.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {users && users.length > 0 && (
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString() || ""}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Atribuir a" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data de Conclusão</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="bg-white border rounded-md p-3">
            <TaskTags
              initialTags={[]}
              onChange={setTags}
              maxTags={8}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Adicione tags para categorizar e facilitar a busca da tarefa.
            </p>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues?.name ? "Atualizar Tarefa" : "Criar Tarefa"}
        </Button>
      </form>
    </Form>
  );
}
