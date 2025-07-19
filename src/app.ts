// -----------------------------
// Project Management App (TypeScript)
// -----------------------------

enum ProjectStatus {
  "active",
  "finished",
}
class Project {
  constructor(
    public id: string,
    public title: string,
    public desc: string,
    public people: number,
    public projectStatus: ProjectStatus
  ) {}
}

/**
 * Interface for validating user input fields.
 */
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

/**
 * Validates a given input based on the provided rules.
 * @param validatableInput - The input and its validation rules.
 * @returns True if valid, false otherwise.
 */
function validate(validatableInput: Validatable): boolean {
  let isValid = true;

  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }

  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length >= validatableInput.minLength;
  }

  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length <= validatableInput.maxLength;
  }

  if (
    validatableInput.min != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }

  if (
    validatableInput.max != null &&
    typeof validatableInput.value === "number"
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }

  return isValid;
}

/**
 * Decorator to automatically bind methods to their class instance.
 * @param _ - Target (unused)
 * @param _2 - Method name (unused)
 * @param descriptor - Property descriptor for the method
 * @returns Adjusted property descriptor with bound method
 */
function AutoBind(_: any, _2: string, descriptor: PropertyDescriptor) {
  let originalMethod = descriptor.value;
  let adjustedDescriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: true,
    get() {
      return originalMethod.bind(this);
    },
  };
  return adjustedDescriptor;
}

type Listner = (ietms: Project[]) => void;
class ProjectState {
  private listners: Listner[] = [];
  private projects: Project[] = [];

  private static instance: ProjectState;

  private constructor() {}

  static getInstance() {
    if (!ProjectState.instance) {
      ProjectState.instance = new ProjectState();
    }
    return ProjectState.instance;
  }

  addProjects(title: string, desc: string, numOfPeople: number) {
    let newProject = new Project(
      Math.random().toString(),
      title,
      desc,
      numOfPeople,
      ProjectStatus.active
    );
    this.projects.push(newProject);
    for (const listnerFn of this.listners) {
      listnerFn([...this.projects]);
    }
  }

  addListener(listner: Listner) {
    this.listners.push(listner);
  }
}

const projectState = ProjectState.getInstance();

// -----------------------------
// Project List Class
// -----------------------------

/**
 * Renders a list of projects (active or finished) in the DOM.
 */
class ProjectList {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLElement;
  assignedProjects: Project[];

  /**
   * @param type - The type of project list ('active' or 'finished')
   */
  constructor(private type: "active" | "finished") {
    this.templateElement = document.getElementById(
      "project-list"
    ) as HTMLTemplateElement;

    this.hostElement = document.getElementById("app") as HTMLDivElement;
    this.assignedProjects = [];

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );

    this.element = importedNode.firstElementChild as HTMLElement;
    this.element.id = `${this.type}-projects`;
    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter((prj) => {
        if (this.type === "active") {
          return prj.projectStatus === ProjectStatus.active;
        }
        return prj.projectStatus === ProjectStatus.finished;
      });
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
    this.attach();
    this.renderContent();
  }

  private renderProjects() {
    let listEL = document.getElementById(`${this.type}-project-list`)!;
    listEL.innerHTML = ``;
    for (const projectItem of this.assignedProjects) {
      const listItem = document.createElement("li");
      listItem.textContent = projectItem.title;
      listEL.appendChild(listItem);
    }
  }

  /**
   * Renders the content (header and list) for the project list.
   */
  private renderContent() {
    const listId = `${this.type}-project-list`;
    this.element.querySelector("ul")!.id = listId;
    this.element.querySelector(
      "h2"
    )!.textContent = `${this.type.toUpperCase()} PROJECTS`;
  }

  /**
   * Attaches the project list element to the DOM.
   */
  private attach() {
    this.hostElement.insertAdjacentElement("beforeend", this.element);
  }
}

// -----------------------------
// Project Input Class
// -----------------------------

/**
 * Handles the user input form for creating new projects.
 */
class ProjectInput {
  templateElement: HTMLTemplateElement;
  hostElement: HTMLDivElement;
  element: HTMLFormElement;
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    this.templateElement = document.getElementById(
      "project-input"
    ) as HTMLTemplateElement;

    this.hostElement = document.getElementById("app") as HTMLDivElement;

    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );

    this.element = importedNode.firstElementChild as HTMLFormElement;
    this.element.id = "user-input";

    this.titleInputElement = this.element.querySelector(
      "#title"
    ) as HTMLInputElement;

    this.descriptionInputElement = this.element.querySelector(
      "#description"
    ) as HTMLInputElement;

    this.peopleInputElement = this.element.querySelector(
      "#people"
    ) as HTMLInputElement;

    this.configure();
    this.attach();
  }

  /**
   * Configures the form event listener.
   */
  private configure() {
    this.element.addEventListener("submit", this.submitHandler);
  }

  /**
   * Attaches the form element to the DOM.
   */
  private attach() {
    this.hostElement.insertAdjacentElement("afterbegin", this.element);
  }

  /**
   * Gathers and validates user input from the form fields.
   * @returns A tuple of [title, description, people] if valid, otherwise void.
   */
  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement?.value;
    const enteredDescription = this.descriptionInputElement?.value;
    const enteredPeople = this.peopleInputElement?.value;

    let validatableTitle: Validatable = {
      value: enteredTitle,
      required: true,
      minLength: 5,
    };
    let validatableDescription: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5,
    };
    let validatablePeople: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 5,
    };

    if (
      !validate(validatableTitle) ||
      !validate(validatablePeople) ||
      !validate(validatableDescription)
    ) {
      alert("Invalid input, please try again");
      return;
    }
    return [enteredTitle, enteredDescription, +enteredPeople];
  }

  /**
   * Handles the form submission event, validates input, and clears the form.
   * @param event - The submit event
   */
  @AutoBind
  private submitHandler(event: Event) {
    event.preventDefault();
    let userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, desc, people] = userInput;
      projectState.addProjects(title, desc, people);
      this.clearInput();
    }
  }

  /**
   * Clears the input fields in the form.
   */
  private clearInput() {
    this.titleInputElement.value = "";
    this.descriptionInputElement.value = "";
    this.peopleInputElement.value = "";
  }
}

// -----------------------------
// App Initialization
// -----------------------------

// Create the input form and both project lists (active and finished)
let projectInput = new ProjectInput();
let activeProjects = new ProjectList("active");
let finishedProjects = new ProjectList("finished");
