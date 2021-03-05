#### Sección 2: Esqueleto caminante Parte 1 - API

##### 9 Crear una entidad de dominio

Se borra la clase de ejemplo del proyecto Domain/ y se crea la nueva clase Activity. Como identificador se usa Guid, porque se puede generar tanto en la capa de servicios como en la de cliente.

##### 10 Añadir un Db Context de Entity Framework

Se añade el nuget microsoft.entityframeworkcore.sqlite mediante la galería al proyecto Persistence/.

Se crea la clase DataContext derivada de DbContext y se genera el constructor (con opciones). Se añade una propiedad Activities de tipo DbSet<Activity> que representa la tabla en la base de datos.

La propiedad Id de Activity es especial, porque EF la interpreta como clave primaria de la tabla.

Hay que inyectar DataContext como un servicio accesible para nuestra aplicación. Se lleva acabo en la clase Startup.

```c#
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.OpenApi.Models;
using Persistence;

namespace API
{
    public class Startup
    {
        private readonly IConfiguration _config;
        public Startup(IConfiguration config)
        {
            _config = config;
        }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {

            services.AddControllers();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "API", Version = "v1" });
            });
            services.AddDbContext<DataContext>(opt =>
            {
                opt.UseSqlite(_config.GetConnectionString("DefaultConnection"));
            });
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "API v1"));
            }

            // app.UseHttpsRedirection();

            app.UseRouting();

            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}

```

##### 11 Crear la primera migración Entity Framework

```bash
[joan@alkaid reactivities]$ dotnet tool list --global
Package Id      Version      Commands 
--------------------------------------
dotnet-ef       5.0.1        dotnet-ef
[joan@alkaid reactivities]$ dotnet tool update --global dotnet-ef --version 5.0.3
Tool 'dotnet-ef' was successfully updated from version '5.0.1' to version '5.0.3'.
```

Es necesario instalar **Microsoft.EntityFrameworkCore.Design** en el proyecto API/ para poder ejecutar las migraciones.

```bash
[joan@alkaid reactivities]$ dotnet ef migrations add InitialCreate -p Persistence -s API
Build started...
Build succeeded.
info: Microsoft.EntityFrameworkCore.Infrastructure[10403]
      Entity Framework Core 5.0.3 initialized 'DataContext' using provider 'Microsoft.EntityFrameworkCore.Sqlite' with options: None
Done. To undo this action, use 'ef migrations remove'
```

##### 12 Crear la base de datos

En lugar de usar el comando `dotnet ef database update` se diseña la estrategia de actualizar la base de datos en ejecución, cuando sea necesario.

Nos interesa obtener el contexto de la base de datos en `Main` de `Program` para usar el método `Migrate`.

También se usa el servicio ILogger para tratar un error durante la migración.

Al ejecutar la aplicación se puede constatar la creación de la base de datos y la tabla Activities en las trazas del terminal.

```c#
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Persistence;

namespace API
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var host = CreateHostBuilder(args).Build();

            using var scope = host.Services.CreateScope();

            var services = scope.ServiceProvider;

            try
            {
                var context = services.GetRequiredService<DataContext>();
                context.Database.Migrate();
            }
            catch (Exception ex)
            {
                var logger = services.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "An error occured during Migration");
            }

            host.Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                });
    }
}
```

La extensión SQLite nos permite abrir la base de datos utilizando el comando `SQLite: Open Database`. La tabla `Activities` de momento está vacía.

##### 13 Sembrar datos en la Base de datos

Se crea una clase `Seed` en `Persistence/` con la información necesaria para añadir información en la base de datos cuando esté vacía. La definición completa de la clase está en el archivo `SeedData.txt` de los recursos del curso. El método estático `SeedData` se usa en `Program`, después de la migración.

Después de ejecutar el API comprobamos que los registros se han insertado mediante SQLite Explorer.

##### 14 Añadir un controlador de API

En `API/Controllers/` Se crea un controlador base que tiene las características comunes de todos los controladores, `BaseApiController`.

Se procede a definir un nuevo `ActivitiesController`, al que se inyecta `DataContext` en el constructor.

Incluimos los 2 primeros *endpoint*: getActivities y getActivity.

##### 15 Guardar los cambios en el control de código

```bash
[joan@alkaid reactivities]$ git status
fatal: no és un dipòsit de git (ni cap pare fins al punt de muntatge /)
S'atura a la frontera de sistema de fitxers (GIT_DISCOVERY_ACROSS_FILESYSTEM no està establert).
[joan@alkaid reactivities]$ git init
S'ha inicialitzat un dipòsit buit del Git en /home/joan/e-learning/udemy/reactivities/.git/
[joan@alkaid reactivities]$ dotnet new gitignore
The template "dotnet gitignore file" was created successfully.
```

Incluye 210 archivos, muchos de los cuales no interesan porque se regeneran automáticamente. Con la plantilla `gitignore` pasamos a 27 (incluyendo este documento).

Se pretende además ignorar los archivos de configuración.

```.gitignore
## Ignore Visual Studio temporary files, build results, and
## files generated by popular Visual Studio add-ons.
##
## Get latest from https://github.com/github/gitignore/blob/master/VisualStudio.gitignore

appsettings.json

# User-specific files
*.rsuser
*.suo
*.user
*.userosscache
*.sln.docstates
```

```bash
[joan@alkaid reactivities]$ git add .
[joan@alkaid reactivities]$ git commit -m "End of section 2"
[master (comissió arrel) 1febb7b] End of section 2
 25 files changed, 1380 insertions(+)
 create mode 100644 .gitignore
 create mode 100644 .vscode/launch.json
 create mode 100644 .vscode/tasks.json
 create mode 100644 API/API.csproj
 create mode 100644 API/Controllers/ActivitiesController.cs
 create mode 100644 API/Controllers/BaseApiController.cs
 create mode 100644 API/Controllers/WeatherForecastController.cs
 create mode 100644 API/Program.cs
 create mode 100644 API/Properties/launchSettings.json
 create mode 100644 API/Startup.cs
 create mode 100644 API/WeatherForecast.cs
 create mode 100644 API/appsettings.Development.json
 create mode 100644 API/reactivities.db
 create mode 100644 Application/Application.csproj
 create mode 100644 Application/Class1.cs
 create mode 100644 Domain/Activity.cs
 create mode 100644 Domain/Domain.csproj
 create mode 100644 Persistence/DataContext.cs
 create mode 100644 Persistence/Migrations/20210214212737_InitialCreate.Designer.cs
 create mode 100644 Persistence/Migrations/20210214212737_InitialCreate.cs
 create mode 100644 Persistence/Migrations/DataContextModelSnapshot.cs
 create mode 100644 Persistence/Persistence.csproj
 create mode 100644 Persistence/Seed.cs
 create mode 100644 doc/reactivities.md
 create mode 100644 reactivities.sln
 [joan@alkaid reactivities]$ git branch -M main
[joan@alkaid reactivities]$ git remote add origin https://github.com/jonogal/reactivities.git
[joan@alkaid reactivities]$ git push -u origin main
S'estan enumerant els objectes: 36, fet.
S'estan comptant els objectes: 100% (36/36), fet.
Delta compression using up to 8 threads
S'estan comprimint els objectes: 100% (34/34), fet.
S'estan escrivint els objectes: 100% (36/36), 15.52 KiB | 3.10 MiB/s, fet.
Total 36 (delta 4), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (4/4), done.
To https://github.com/jonogal/reactivities.git
 * [new branch]      main -> main
La branca «main» està configurada per a seguir la branca remota «main» de «origin».
```

##### 16 Sumario de la sección 2

#### Sección 3: Esqueleto caminante Parte 2 - Cliente

##### 17 Introducción

Objetivos de aprendizaje

- Create-react-app
- React project files
- React concepts
- React Dev tools
- Typescript
- Axios
- Semantic-ui

##### 18 Crear el proyecto 

https://reactjs.org/docs/create-a-new-react-app.html

```bash
[joan@alkaid reactivities]$ node --version
v15.8.0
[joan@alkaid reactivities]$ npm --version
7.5.2
[joan@alkaid reactivities]$ npx create-react-app client-app --use-npm --template typescript

Creating a new React app in /home/joan/e-learning/udemy/reactivities/client-app.

Installing packages. This might take a couple of minutes.
Installing react, react-dom, and react-scripts with cra-template-typescript...


added 1934 packages, and audited 1935 packages in 38s

125 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

Installing template dependencies using npm...

added 36 packages, changed 1 package, and audited 1971 packages in 5s

125 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

We detected TypeScript in your project (src/App.test.tsx) and created a tsconfig.json file for you.

Your tsconfig.json has been populated with default values.

Removing template package using npm...


removed 1 package, and audited 1970 packages in 4s

125 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

Success! Created client-app at /home/joan/e-learning/udemy/reactivities/client-app
Inside that directory, you can run several commands:

  npm start
    Starts the development server.

  npm run build
    Bundles the app into static files for production.

  npm test
    Starts the test runner.

  npm run eject
    Removes this tool and copies build dependencies, configuration files
    and scripts into the app directory. If you do this, you can’t go back!

We suggest that you begin by typing:

  cd client-app
  npm start

Happy hacking!
```

https://git-scm.com/book/en/v2/Customizing-Git-Git-Configuration

```bash
[joan@alkaid ~]$ git config --global user.name "Joan Noguera"
[joan@alkaid ~]$ git config --global user.email jn.noguera@gmail.com
[joan@alkaid ~]$ cat ~/.gitconfig
[user]
	name = Joan Noguera
	email = jn.noguera@gmail.com
```



##### 19 Revisar los archivos del proyecto React

`tsconfig.json`

Al tratarse de una SPA Aplicación de Página Única sólo tenemos un `public/index.html.`

`src/index.tsx` Se elimina `React.StrictMode` para garantizar la compatibilidad con React 17 de las herramientas de terceros que utilizaremos.

`App.tsx` La aplicación que se incrusta en el `div` `root` de la página principal.

`package.json` Contiene la lista de dependencias.

##### 20 Por qué React?

##### 21 Componentes React

Una página React está formada por diferentes componentes y cada componente contienen todos los elementos necesarios para su uso, funcionalidad, reproducción y estilos, js/html/css. Un componente tiene su propio estado y se carga mediante propiedades. Mediante el paso de funciones un componente puede modificar el estado de otro.

React, a diferencia de otras librerías como jQuery,  utiliza un DOM virtual. El DOM virtual proporciona una mayor rapidez en la reproducción de elementos. Además aplica un enlace unidireccional, del DOM virtual al DOM y no al revés como hace por ejemplo Angular.

Otro concepto importante en React son los archivos jsx/tsx, para representar un componente.

React Hooks son funciones que permiten "entrar" en el estado de un componente:

* useState()
* useEffect()
* useLoQueQueramos()

##### 22 Conceptos TypeScript

* Tipos fuertes.
* Orientado a objectos.
* Mejor intellisense.
* Modificadores de acceso.
* Características futuras de JS.
* Detecta errores absurdos durante el desarrollo.
* Librerías de terceros (no siempre dan soporte a TS).
* Fácil de aprender si conoces JS.
* Muy mejorado en React.

##### 23 Demostración TypeScript

##### 24 Usar TypeScript con React

##### 25 Herramientas de desarrollo React

Para Chrome y Firefox. Se usa como ejemplo la página de Netflix.

##### 26 Obtener datos de la API

https://github.com/axios/axios

```bash
[joan@alkaid reactivities]$ cd client-app/
[joan@alkaid client-app]$ npm install axios

added 1 package, and audited 1971 packages in 4s

125 packages are looking for funding
  run `npm fund` for details

3 high severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
```

Se utiliza **React Hooks** en el componente `App` para cargar la lista de actividades mediante `axios`.

```tsx
import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import axios from 'axios';

function App() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/activities').then(response => {
      console.log(response);
      setActivities(response.data);
    })
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <ul>
          {activities.map((activity: any) => (
            <li key={activity.id}>
              {activity.title}
            </li>
          ))}
        </ul>
      </header>
    </div>
  );
}

export default App;
```

##### 27 Política CORS

Se añade la política CORS en la API, concretamente en Startup.cs como un nuevo servicio usado en la configuración de la petición HTTP.

##### 28 Semantic UI React

https://react.semantic-ui.com/

```bash
[joan@alkaid client-app]$ npm install semantic-ui-react semantic-ui-css --no-audit

added 16 packages in 5s

126 packages are looking for funding
  run `npm fund` for details
```

Se realizan los cambios pertinentes en el componente `App` para utilizar componentes visuales de la librería y obtener una nueva presentación de la lista de actividades.

```tsx
import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import { Header, List } from 'semantic-ui-react';

function App() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/activities').then(response => {
      console.log(response);
      setActivities(response.data);
    })
  }, []);

  return (
    <div>
      <Header as='h2' icon='users' content='Reactivities' />
      <List>
      {activities.map((activity: any) => (
            <List.Item key={activity.id}>
              {activity.title}
            </List.Item>
          ))}
      </List>
    </div>
  );
}

export default App;
```

git stage + commit  (End of section 3) + push

##### 29 Sumario de la sección 3

#### Sección 4: Crear una aplicación CRUD utilizando CQRS + el patrón Mediator

##### 30 Introducción

> [joan@alkaid client-app]$ npx npm-check-updates -u
> Upgrading /home/joan/e-learning/udemy/reactivities/client-app/package.json
> [====================] 15/15 100%
>
> All dependencies match the latest package versions :)
> [joan@alkaid client-app]$ npm outdated
> Package      Current    Wanted    Latest  Location                  Depended by
> @types/node  12.20.4  14.14.31  14.14.31  node_modules/@types/node  client-app

##### 31 Arquitectura Limpia

https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html

![](/home/joan/e-learning/udemy/reactivities/doc/images/31.1.png)

##### 32 CQRS

Command Query Responsability Separation

##### 34 Crear nuestro primer manipulador de Consulta

Hay que instalar el paquete `MediatR.Extensions.Microsoft.DependencyInyection` en el proyecto `Application`.

Se crea la nueva clase `List` en el apartado `Activities` de características de la aplicación. La lógica se mueve al proyecto `Application`.

```c#
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Activities
{
    public class List
    {
        public class Query : IRequest<List<Activity>> { }

        public class Handler : IRequestHandler<Query, List<Activity>>
        {
            private readonly DataContext _context;
            public Handler(DataContext context)
            {
                _context = context;
            }

            public async Task<List<Activity>> Handle(Query request, CancellationToken cancellationToken)
            {
                return await _context.Activities.ToListAsync();
            }
        }
    }
}
```

Hay que rehacer el controlador de actividades. En lugar de inyectar el `DataContext` es necesario establecer `MediatR` como un servicio en `Startup` e inyectarlo en el controlador.

```c#
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Application.Activities;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class ActivitiesController : BaseApiController
    {
        private readonly IMediator _mediator;
        public ActivitiesController(IMediator mediator)
        {
            this._mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult<List<Activity>>> GetActivities()
        {
            return await _mediator.Send(new List.Query());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Activity>> GetActivity(Guid id)
        {
            return Ok();
        }
    }
}
```

##### 34 Controladores ligeros en la API

El servicio`MediatR` se hace accesible en la clase base del controlador mediante el atributo protegido `Mediator`.

```c#
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BaseApiController : ControllerBase
    {
        private IMediator _mediator;

        protected IMediator Mediator => _mediator ??= HttpContext.RequestServices
            .GetService<IMediator>();
    }
}
```

##### 35 Añadir un manipulador de Detalles

`Application.Activities.Details`

##### 36 Añadir un manipulador de Crear

```c#
using System.Threading;
using System.Threading.Tasks;
using Domain;
using MediatR;
using Persistence;

namespace Application.Activities
{
    public class Create
    {
        public class Command : IRequest
        {
            public Activity Activity { get; set; }
        }

        public class Handler : IRequestHandler<Command>
        {
            private readonly DataContext _context;
            public Handler(DataContext context)
            {
                _context = context;
            }

            public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
            {
                _context.Activities.Add(request.Activity);

                await _context.SaveChangesAsync();

                return Unit.Value;
            }
        }
    }
}
```

##### 37 Añadir un manipulador de Editar

```c#
using System.Threading;
using System.Threading.Tasks;
using Domain;
using MediatR;
using Persistence;

namespace Application.Activities
{
    public class Edit
    {
        public class Command : IRequest
        {
            public Activity Activity { get; set; }
        }

        public class Handler : IRequestHandler<Command>
        {
            private readonly DataContext _context;
            public Handler(DataContext context)
            {
                _context = context;
            }

            public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
            {
                var activity = await _context.Activities.FindAsync(request.Activity.Id);

                activity.Title = request.Activity.Title ?? activity.Title;
                // resto de atributos de la actividad...

                await _context.SaveChangesAsync();

                return Unit.Value;
            }
        }        
    }
}
```

##### 38 Añadir `AutoMapper`

Se instala el paquete `AutoMapper.Extensions.Microsoft.DependencyInyection` en el proyecto `Application`. Utilizar AutoMapper simplifica la tarea de copiar los atributos de un objeto a otro, como ocurre en el manipulador de Editar.

##### 39 Añadir un manipulador de Borrar

Se resalta que hasta se ha desarrollado el camino feliz, sin control de errores. Por ejemplo al usar un Id que no existe al borrar o editar una actividad.

##### 40 Limpieza de la clase `Startup`

El objetivo es crear una extensión de `IServiceCollection` y mover parte del código de `Startup`.

##### 41 `Tokens` de cancelación

Se hace una prueba para explicar cómo se puede usar `CancellationToken` para interrumpir la ejecución de un `endpoint` de la API.

##### 42 Usar el depurador de VS Code

##### 43 Sumario de la sección 4

#### Sección 5: Crear una aplicación CRUD en React

##### 44 Introducción

* Estructura de carpetas
* Interfaces TypeScript
* Componentes SemanticUI
* Formularios básicos en React
* Operaciones CRUD

##### 45 Estructura de carpetas

https://reactjs.org/docs/faq-structure.html

Se opta por usar la organización por características.

##### 46 Añadir una interfaz de Actividad

http://localhost:5000/swagger/index.html

Se copia el objecto actividad de `/api/Activities`:

```json
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "string",
    "date": "2021-02-23T20:28:37.026Z",
    "description": "string",
    "category": "string",
    "city": "string",
    "venue": "string"
  }
```

y se lleva a http://www.jsontots.com/ para generar una interfaz

```tsx
interface RootObject {
  id: string;
  title: string;
  date: string;
  description: string;
  category: string;
  city: string;
  venue: string;
}
```

ahora podemos tipificar la lista de actividades y la actividad individual en `App.tsx`:

```tsx
const [activities, setActivities] = useState<Activity[]>([]);
```

También nos beneficiamos de Intellisense al escribir el código.

##### 47 Añadir una barra de navegación

Usaremos el componente `Menu` de las `Collections` de Semantic UI.

src/app/layout/NavBar.tsx

```tsx
import React from 'react';
import { Button, Container, Menu } from 'semantic-ui-react';

export default function NavBar() {
    return (
        <Menu inverted fixed='top'>
            <Container>
                <Menu.Item header>
                    <img src="/assets/logo.png" alt="logo" />
                    Reactivities
                </Menu.Item>
                <Menu.Item name='Activities' />
                <Menu.Item>
                    <Button positive content='Create Activity' />
                </Menu.Item>
            </Container>
        </Menu>
    )
}
```

##### 48 Añadir algo de estilo a la barra de navegación

##### 49 Crear el panel de control de actividades

La lista de actividades pasa del componente `App` al `ActivityDashboard`, inicialmente sin variar el modo de presentación aunque en un contenedor de tipo `Grid` de 10 columnas (de las 16 que maneja Semantic UI). Las variables de estado se pasan a los componentes descendientes mediante propiedades.

##### 50 Crear una lista de actividades

Mostrando más atributos para cada una de las actividades. Se crea un componente `ActivityList` que se usa en `ActivityDashboard`.

![](/home/joan/e-learning/udemy/reactivities/doc/images/50.1.png)

##### 51 Crear una vista de detalles

Se usa un `Card` para mostrar el detalle de la actividad seleccionada, al que de momento se le pasa como propiedad la primera actividad.

El panel de control de actividades queda formado por 2 columnas. Es importante destacar la necesidad de asegurar la existencia de la actividad en el momento de mostrar el detalle.

```tsx
import Rect from 'react';
import { Grid } from 'semantic-ui-react';
import { Activity } from '../../../app/models/activity';
import ActivityDetails from '../details/ActivityDetails';
import ActivityList from './ActivityList';

interface Props {
    activities: Activity[];
}

export default function ActivityDashboard({ activities }: Props) {
    return (
        <Grid>
            <Grid.Column width='10'>
                <ActivityList activities={activities} />
            </Grid.Column>
            <Grid.Column width='6'>
                {activities[0] &&
                    <ActivityDetails activity={activities[0]} />}
            </Grid.Column>
        </Grid>
    )
}
```

##### 52 Crear un formulario de actividad

Para editar o crear una actividad.

Se añade un formulario sin funcionalidad en el panel de control de actividades, debajo del detalle de la actividad seleccionada.

##### 53 Seleccionar una actividad para consultarla

Al pulsar el botón `View` actualizar los detalles de la actividad seleccionada.

Se crea una variable de estado en `App` que representa la actividad seleccionada, inicialmente `undefined`.

```tsx
const [selectedActivity, setSelectedActivity] = useState<Activity | undefined>(undefined)
```

Se crean 2 funciones para manipular la selección de una actividad, que se pasarán a través del panel de control a los componentes donde se requiera.

##### 54 Mostrar el formulario de crear/editar

Para controlar si se está editando o no una actividad necesitamos una nueva variable de estado.

```tsx
const [editMode, setEditMode] = useState(false);
```

Se infiere automáticamente el tipo de la variable por su valor inicial falso.

Se añaden 2 funciones para  abrir y cerra el formulario. Se establece el mecanismo para no mostrar el detalle si se está en modo edición.

##### 55 Editar una actividad y uso básico de formularios en React

Hasta ahora sólo hemos dado estilo al formulario de edición construido. Lo que se escribe en los campos de entrada únicamente actualiza el DOM, no React. Tenemos que hacer que React manipule el estado del formulario,

Se trabaja sobre el componente `ActivityForm`.

```tsx
import React, { ChangeEvent, useState } from 'react';
import { Button, Form, Segment } from 'semantic-ui-react';
import { Activity } from '../../../app/models/activity';

interface Props {
    activity: Activity | undefined;
    closeForm: () => void;
}

export default function ActivityForm({activity: selectedActivity, closeForm}: Props) {

    const initialState = selectedActivity ?? {
        id: '',
        title: '',
        category: '',
        description: '',
        date: '',
        city: '',
        venue: ''
    }

    const [activity, setActivity] = useState(initialState);

    function handleSubmit() {
        console.log(activity);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        const {name, value} = event.target;
        setActivity({...activity, [name]: value});
    }
    
    return (
        <Segment clearing>
            <Form onSubmit={handleSubmit} autoComplete='off'>
                <Form.Input placeholder='Title' value={activity.title} name='title' onChange={handleInputChange} />
                <Form.TextArea placeholder='Description' />
                <Form.Input placeholder='Category' />
                <Form.Input placeholder='Date' />
                <Form.Input placeholder='City' />
                <Form.Input placeholder='Venue' />
                <Button floated='right' positive type='submit' content='Submit' />
                <Button onClick={closeForm} floated='right' type='button' content='Cancel' />
            </Form>
        </Segment>
    )
}
```

En la consola se pueden ver los cambios en el campo Título.

##### 56 Manipular el envío para crear o editar

Realmente no se puede crear una actividad porque no tenemos `id`.

```tsx
function handleCreateOrEditActivity(activity: Activity) {
  activity.id
    ? setActivities([...activities.filter(x => x.id !== activity.id), activity])
    : setActivities([...activities, activity]);
  setEditMode(false);
  setSelectedActivity(activity);
}
```

##### 57 Usar un GUID para el id de la actividad

```bash
[joan@alkaid client-app]$ npm install uuid
changed 1 package, and audited 1987 packages in 3s
...
[joan@alkaid client-app]$ npm i --save-dev @types/uuid
```

```tsx
function handleCreateOrEditActivity(activity: Activity) {
  activity.id
    ? setActivities([...activities.filter(x => x.id !== activity.id), activity])
    : setActivities([...activities, {...activity, id: uuid()}]);
  setEditMode(false);
  setSelectedActivity(activity);
}
```

##### 58 Borrar una actividad

##### 59 Sumario de la sección 5

#### Sección 6: Axios

##### 60 Introducción

* Configurar Axios
* Usar tipos genéricos
* Usar interceptores Axios
* Conectar todas nuestras solicitudes a la API

##### 61 Configurar Axios

Hasta ahora usamos Axios en el componente `App`:

```tsx
useEffect(() => {
  axios.get<Activity[]>('http://localhost:5000/api/activities').then(response => {
    setActivities(response.data);
  })
}, []);
```

Se van a centralizar las llamadas a axios en `agent.ts`.

##### 62 Tipos Axios

Se adapta `agent.ts` para hacer uso de tipos en las llamadas a axios y por ejemplo obtener una lista de actividades (`Promise`) al llamar a `agent.Activities.list()`.

Para presentar las fechas, que están en formato ISO, se les elimina la parte de tiempo. Se muestra año, mes y día salvo en el formulario, en el que al campo de entrada de la fecha se le ha asignado un `type='date'`. 

##### 63 Añadir indicadores de cargando

Se añade un retardo forzado de 1 segundo a las llamadas a la API.

```js
axios.interceptors.response.use(response => {
    return sleep(1000).then(() => {
        return response;
    }).catch((error) => {
        console.log(error);
        return Promise.reject(error);
    })
})
```

Se convierte a `async`, como se sugiere en el código.

```js
axios.interceptors.response.use(async response => {
    try {
        await sleep(1000);
        return response;
    } catch (error) {
        console.log(error);
        return await Promise.reject(error);
    }
})
```

##### 64 Mandar datos al servidor

