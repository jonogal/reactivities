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

##### 65 Borrar una actividad del servidor

El problema es que todos los botones de la lista entran en modo enviar. Hay que identificar qué botón se ve afectado por la operación.

##### 66 Sumario de la sección 6

#### Sección 7: MobX

##### 67 Introducción

* Introducción a la Gestión de Estado
* MobX
* MobX React Lite
* Contexto React

Se va a aligerar el componente App que en este momento mantiene el estado de la aplicación.

##### 68 Qué es MobX

Por qué MobX?

* Está escrito en typescript
* Es más simple que Redux

Funciones del núcleo de MobX

* Observables
* Actions
* Computed properties
* Reactions
* AutoRun

> **Observer pattern**
>
> *From Wikipedia, the free encyclopedia*
>
> The observer pattern is a software design pattern in which an object, named the subject, maintains a list of its dependents, called observers, and notifies them automatically of any state changes, usually by calling one of their methods.
>
> It is mainly used for implementing distributed event handling systems, in "event driven" software.

[MobX Getting started](https://mobx.js.org/getting-started)

![La idea central](/home/joan/e-learning/udemy/reactivities/doc/images/69.1.png)

En primer lugar, está el **estado** de la aplicación. Gráficos de objetos, matrices, primitivas, referencias que forman el modelo de su aplicación. Estos valores son las "celdas de datos" de su aplicación.

En segundo lugar, hay **derivaciones**. Básicamente, cualquier valor que se pueda calcular automáticamente a partir del estado de su aplicación. Estas derivaciones, o valores calculados, pueden variar desde valores simples, como el número de tareas pendientes sin terminar (*ToDo's*), hasta cosas complejas como una representación HTML visual de las tareas pendientes (*ToDo's*). En términos de hoja de cálculo: son las fórmulas y gráficos de su aplicación.

Las **reacciones** son muy similares a las derivaciones. La principal diferencia es que estas funciones no producen un valor. En cambio, se ejecutan automáticamente para realizar alguna tarea. Por lo general, esto está relacionado con la E/S. Aseguran que el DOM esté actualizado o de que las solicitudes de red se realicen automáticamente en el momento adecuado.

Finalmente hay **acciones**. Las acciones son todas las cosas que alteran el estado. MobX se asegurará de que todos los cambios en el estado de la aplicación causados por sus acciones sean procesados automáticamente por todas las derivaciones y reacciones. De forma sincronizada y sin fallos.

##### 69 Configurar MobX

```bash
[joan@alkaid client-app]$ npm install mobx mobx-react-lite
[joan@alkaid client-app]$ npm list mobx
client-app@0.1.0 /home/joan/e-learning/udemy/reactivities/client-app
├─┬ mobx-react-lite@3.2.0
│ └── mobx@6.1.8 deduped
└── mobx@6.1.8
```
`src/app/stores/activityStore.ts`

```tsx
import { makeObservable, observable } from "mobx";

export default class ActivityStore {
    title = 'Hello from Mobx';

    constructor() {
        makeObservable(this, {
            title: observable
        })
    }
}
```
`src/app/stores/store.ts`

```tsx
import { createContext, useContext } from "react";
import ActivityStore from "./activityStore";

interface Store {
    activityStore: ActivityStore
}

export const store: Store = {
    activityStore: new ActivityStore()
}

export const StoreContext = createContext(store);

// se crea un react hook para acceder al contexto de los almacenes
// (de momento uno)
export function useStore() {
    return useContext(StoreContext);
}
```

Para dar acceso al contexto al componente `App`:

```tsx
ReactDOM.render(
  <StoreContext.Provider value={store}>
    <App />
  </StoreContext.Provider>,
  document.getElementById('root')
);
```

Se usa el almacén `activityStore` para mostrar el `title` sobre la lista de actividades.

##### 70 Acciones MobX

Se va a mostrar cómo observar la propiedad `title` desde uno de los componentes react.

Para enlazar `bind` una función a una clase, como un método, se puede usar `action.bound` o declararla como una función de flecha `arrow function`.

```tsx
<NavBar openForm={handleFormOpen} />
<Container style={{ marginTop: '7em' }}>
  <h2>{activityStore.title}</h2>
  <Button content='Add exclamation!' positive onClick={activityStore.setTitle} />
```

Para que el botón funcione hay que declarar el componente `App` como **observador** `observer`.

##### 71 Rehacer la aplicación para usar MobX

Después de mover la lógica de cargar la lista de actividades al almacén activityStore y comprobar que la aplicación funciona tal como lo hacía antes, vemos un problema en la consola.

```
[MobX] Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed. Tried to modify: ActivityStore@1.loadingInitial react_devtools_backend.js:2430:23
```

##### 72 Modo estricto de MobX

Se puede solventar el error anterior usando `runInAction`, que admite una función. También se solventa definiendo una función que modifique el valor de `loadingInitial`.

##### 73 Seleccionar una actividad

##### 74 Crear una actividad usando MobX

##### 75 Eliminar una actividad usando MobX

##### 76 Usar un objeto map de Javascript para almacenar las actividades

> En este punto la aplicación está refactorizada para utilizar MobX.

Tiene muchas más ventajas que utilizar un `array` de actividades, como hasta ahora.  Una vez que el estado se maneja completamente desde el almacén de actividades, el cambio se simplifica.

##### 77 Sumario de la sección 7

#### Sección 8: Encaminamiento

##### 78 Introducción

* Por qué necesitamos un encaminador?
* React-Router
* API de React Router
* Historial

Las SPA necesitan routers. Sólo tenemos una página (index.html) y los cambios son entre componentes.

##### 79 Instalar React Router

[React Router](https://reactrouter.com/)

```bash
[joan@alkaid client-app]$ npm install react-router-dom
[joan@alkaid client-app]$ npm install @types/react-router-dom --save-dev
[joan@alkaid client-app]$ npm list react-router
client-app@0.1.0 /home/joan/e-learning/udemy/reactivities/client-app
└─┬ react-router-dom@5.2.0
  └── react-router@5.2.0
[joan@alkaid client-app]$ npm list @types/react-router
client-app@0.1.0 /home/joan/e-learning/udemy/reactivities/client-app
└─┬ @types/react-router-dom@5.1.7
  └── @types/react-router@5.1.12
```

`index.tsx`

```tsx
ReactDOM.render(
  <StoreContext.Provider value={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StoreContext.Provider>,
  document.getElementById('root')
);
```

##### 80 Añadir rutas

Se crea un componente `HomePage` que sustituye a `ActivityDashboard` en `App`.

```tsx
import React from 'react';
import { Container } from 'semantic-ui-react';
import NavBar from './NavBar';
import ActivityDashboard from '../../features/activities/dashboard/ActivityDashboard';
import { observer } from 'mobx-react-lite';
import { Route } from 'react-router';
import HomePage from '../../features/home/HomePage';
import ActivityForm from '../../features/activities/form/ActivityForm';

function App() {
  // </> equival a emprar <Fragment/>
  return (
    <>
      <NavBar />
      <Container style={{ marginTop: '7em' }}>
        <Route exact path='/' component={HomePage} />
        <Route path='/activities' component={ActivityDashboard} />
        <Route path='/createActivity' component={ActivityForm} />
      </Container>
    </>
  );
}

export default observer(App);
```

##### 81 Añadir enlaces de navegación

```tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button, Container, Menu } from 'semantic-ui-react';
import { useStore } from '../stores/store';

export default function NavBar() {
    const { activityStore } = useStore();
    return (
        <Menu inverted fixed='top'>
            <Container>
                <Menu.Item as={NavLink} to='/' exact header>
                    <img src="/assets/logo.png" alt="logo" style={{ marginRight: '10px' }} />
                    Reactivities
                </Menu.Item>
                <Menu.Item as={NavLink} to='/activities' name='Activities' />
                <Menu.Item>
                    <Button as={NavLink} to='/createActivity' positive content='Create Activity' />
                </Menu.Item>
            </Container>
        </Menu>
    )
}
```

##### 82 Añadir un enlace a detalles

Se cambia el `onClick` del `Button` View a un `Link`, pasando el id de la actividad en la ruta.

```tsx
<Button as={Link} to={`/activities/${activity.id}`} floated='right' content='View' color='blue' />
```

##### 83 Obtener una actividad individual

Hasta ahora se mostraba el detalle de una actividad a partir de los datos en memoria de la lista de actividades. Al usar una ruta tenemos el id de la actividad en el URL

http://localhost:3000/activities/ba1347b9-baff-40ca-b7db-df4557c749ae

y pulsar el botón View tiene que equivaler a refrescar la página en el navegador. Es necesario usar la API.

Se eliminan los métodos:

* selectActivity
* cancelSelectedActivity
* openForm
* closeForm

##### 84 Usar parámetros de ruta

Es necesario un método `loadActivity` en `activityStore` que determine si utilizan las actividades en memoria o va a buscar la actividad mediante la API.

En el detalle `activityDetails` se usan los hook `useParams` y `useEffect` para obtener el id y buscarla la actividad en el almacén respectivamente.

> `useParams` returns an object of key/value pairs of URL parameters. Use it to access `match.params` of the current `<Route>`.

https://reactrouter.com/web/api/Hooks/useparams

##### 85 Añadir una ruta para editar una actividad

Se incluye en la ruta del componente `ActivityForm`, en `App`.

```tsx
<Route path={['/createActivity', '/manage/:id']} component={ActivityForm} />
```

Se modifican los botones de `ActivityDetails` convirtiéndolos en un enlace.

##### 86 Añadir una clave  la ruta

Existe un problema cuando se pasa de editar una actividad a crear una nueva. El formulario no reacciona, no se limpia el contenido de los campos como realmente se espera. El componente pasa de recibir el `id` en una propiedad a no recibir nada.

Se opta por utilizar un componente completamente incontrolado con una clave, *a fully uncontrolled component with a key*. Se pretende que el componente se reinicie.

Se modifica el componente `App` para añadir una clave a la ruta que activa el formulario. 

##### 87 Redireccionar después de enviar el formulario

##### 88 Mover la página de inicio fuera de la barra de navegación 

##### 89 Limpiar código no utilizado

Se cargarán las actividades una única vez, al cargar el componente `ActivityDashboard`.

Se incluye un enlace en el botón cancelar del formulario. Es necesario un ajuste al punto anterior para evitar un efecto no deseado al refrescar la página en el momento de edición. Queda 1 solo elemento en la lista de actividades.

```tsx
if (activityRegistry.size <= 1) loadActivities();
```

##### 90 Sumario de la sección 8

#### Sección 9: Estilizar la interfaz de usuario

##### 91 Introducción

##### 92 Estilizar la lista de actividades

Se crea un nuevo componente `ActivityListItem`. Inicialmente la vista queda exactamente igual.

##### 93 Agrupar las actividades por fecha

Se usa la función `reduce` de un `Array`. A partir de la función `activitiesByDate` de `activityStore` se va a obtener un objeto con claves por fecha y a cada clave se le asociará una lista de actividades. Se crea una nueva función `groupedActivities`. Muy interesante:

```tsx
get groupedActivities() {
    return Object.entries(
        this.activitiesByDate.reduce((activities, activity) => {
            const date = activity.date;
            activities[date] = activities[date] ? [...activities[date], activity] : [activity];
            return activities;
        }, {} as {[key: string]: Activity[]})
    )
}
```

 Ahora se transforma `ActivityList` para usar las actividades agrupadas por fecha.

![](/home/joan/e-learning/udemy/reactivities/doc/images/94.1.png)

##### 94 Estilizar los elementos de la lista

Se cambia completamente la definición del `ActivityListItem`.

```tsx
import React, { SyntheticEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Item, Label } from 'semantic-ui-react';
import { Activity } from '../../../app/models/activity';
import { useStore } from '../../../app/stores/store';

interface Props {
    activity: Activity
}

export default function ActivityListItem({ activity }: Props) {
    const [target, setTarget] = useState('');

    const { activityStore } = useStore();
    const { deleteActivity, activitiesByDate, loading } = activityStore;

    function handleActivityDelete(e: SyntheticEvent<HTMLButtonElement>, id: string) {
        setTarget(e.currentTarget.name);
        deleteActivity(id);
    }

    return (
        <Item key={activity.id}>
            <Item.Content>
                <Item.Header as='a'>{activity.title}</Item.Header>
                <Item.Meta>{activity.date}</Item.Meta>
                <Item.Description>
                    <div>{activity.description}</div>
                    <div>{activity.city}, {activity.venue}</div>
                </Item.Description>
                <Item.Extra>
                    <Button as={Link} to={`/activities/${activity.id}`} floated='right' content='View' color='blue' />
                    <Button
                        name={activity.id}
                        loading={loading && target === activity.id}
                        onClick={(e) => { handleActivityDelete(e, activity.id) }}
                        floated='right'
                        content='Delete'
                        color='red'
                    />
                    <Label basic content={activity.category} />
                </Item.Extra>
            </Item.Content>
        </Item>
    );
}
```

```tsx
import React, { SyntheticEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon, Item, Label, Segment } from 'semantic-ui-react';
import { Activity } from '../../../app/models/activity';
import { useStore } from '../../../app/stores/store';

interface Props {
    activity: Activity
}

export default function ActivityListItem({ activity }: Props) {
    const [target, setTarget] = useState('');

    const { activityStore } = useStore();
    const { deleteActivity, activitiesByDate, loading } = activityStore;

    function handleActivityDelete(e: SyntheticEvent<HTMLButtonElement>, id: string) {
        setTarget(e.currentTarget.name);
        deleteActivity(id);
    }

    return (
        <Segment.Group>
            <Segment>
                <Item.Group>
                    <Item>
                        <Item.Image size='tiny' circular src='/assets/user.png' />
                        <Item.Content>
                            <Item.Header as={Link} to={`/activities/${activity.id}`}>
                                {activity.title}
                            </Item.Header>
                            <Item.Description>Hosted by Bob</Item.Description>
                        </Item.Content>
                    </Item>
                </Item.Group>
            </Segment>
            <Segment>
                <span>
                    <Icon name='clock' /> {activity.date}
                    <Icon name='marker' /> {activity.venue}
                </span>
            </Segment>
            <Segment>
                Attendees go here
            </Segment>
            <Segment clearing>
                <span>{activity.description}</span>
                <Button
                    as={Link}
                    to={`/activities/${activity.id}`}
                    color='teal'
                    floated='right'
                    content='View'
                />
            </Segment>
        </Segment.Group>
    );
}
```

##### 95 Página de detalles de una actividad

Se divide el componente de detalles de actividad en 4:

* `ActivityDetailedHeader`,
* `ActivityDetailedInfo`,
* `ActivityDetailedChat` y
* `ActivityDetailedSidebar`.

Se cambia por completo el componente `ActivityDetails`.

```tsx
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { Button, Card, Image } from 'semantic-ui-react';
import LoadingComponent from '../../../app/layout/LoadingComponent';
import { useStore } from '../../../app/stores/store';

export default observer(function ActivityDetails() {
    const { activityStore } = useStore();
    const { selectedActivity: activity, loadActivity, loadingInitial } = activityStore;
    const { id } = useParams<{ id: string }>()

    useEffect(() => {
        if (id) loadActivity(id);
    }, [id, loadActivity])

    if (loadingInitial || !activity) return <LoadingComponent />;

    return (
        <Card fluid>
            <Image src={`/assets/categoryImages/${activity.category}.jpg`} />
            <Card.Content>
                <Card.Header>{activity.title}</Card.Header>
                <Card.Meta>
                    <span>{activity.date}</span>
                </Card.Meta>
                <Card.Description>
                    {activity.description}
                </Card.Description>
            </Card.Content>
            <Card.Content extra>
                <Button.Group widths='2'>
                    <Button as={Link} to={`/manage/${activity.id}`} basic color='blue' content='Edit' />
                    <Button as={Link} to='/activities' basic color='grey' content='Cancel' />
                </Button.Group>
            </Card.Content>
        </Card>
    )
})
```

```tsx
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { Button, Card, Grid, GridColumn, Image } from 'semantic-ui-react';
import LoadingComponent from '../../../app/layout/LoadingComponent';
import { useStore } from '../../../app/stores/store';
import ActivityDetailedChat from './ActivityDetailedChat';
import ActivityDetailedHeader from './ActivityDetailedHeader';
import ActivityDetailedSidebar from './ActivityDetailedInfo';
import ActivityDetailedInfo from './ActivityDetailedSidebar';

export default observer(function ActivityDetails() {
    const { activityStore } = useStore();
    const { selectedActivity: activity, loadActivity, loadingInitial } = activityStore;
    const { id } = useParams<{ id: string }>()

    useEffect(() => {
        if (id) loadActivity(id);
    }, [id, loadActivity])

    if (loadingInitial || !activity) return <LoadingComponent />;

    return (
        <Grid>
            <GridColumn width={10}>
                <ActivityDetailedHeader />
                <ActivityDetailedInfo />
                <ActivityDetailedChat />
            </GridColumn>
            <Grid.Column width={6}>
                <ActivityDetailedSidebar />
            </Grid.Column>
        </Grid>
    )
})
```

##### 96 Completar los componentes detallados

Se copian de la carpeta de *snippets* directamente.

##### 97 Añadir el componente de filtro de actividad

```bash
[joan@alkaid client-app]$ npm install react-calendar
[joan@alkaid client-app]$ npm install @type/react-calendar
```

Hay que añadir los estilos del calendario en `index.tsx`.

Aparte se usarán estilos propios de la aplicación.

Se copia `box-shadow` de `.ui.vertical.menu`

![](/home/joan/e-learning/udemy/reactivities/doc/images/97.1.png)

##### 98 Estilizando la página de inicio

El estilo también se copia de un *snippet*.

##### 99 Sumario de la sección 9

#### Sección 10: Manejo de errores

##### 100 Introducción

* Validación
* Manejar Respuestas HTTP de Error
* Manejar Excepciones
* *Middleware* personalizado
* Usar interceptores Axios

Hay que tener en cuenta la arquitectura Limpia de la aplicación para el manejo de errores.

##### 101 Validación con anotaciones de datos

Comenzamos con postman (módulo 10), operación *Create Empty Activity*. Cuando se envía la petición a la API la respuesta es un 200 http con un objeto vacío. Efectivamente se crea una actividad nula.

```json
{
    "id": "4804eacb-b64d-48df-8dd3-71f2aa312893",
    "title": null,
    "date": "0001-01-01T00:00:00",
    "description": null,
    "category": null,
    "city": null,
    "venue": null
}
```

Una forma de realizar las validaciones en el servidor es usar anotaciones de datos en `Domain`. En la definición de `Activity` se añade la anotación `[Required]` al atributo `Title`. Sólo con esta acción la respuesta de crear una actividad vacía es un 400 *Bad Request* con el texto de error correspondiente.

```json
{
    "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
    "title": "One or more validation errors occurred.",
    "status": 400,
    "traceId": "00-0a6bed3491fea74881a624ed823f7475-af6c9a89c3f8a04c-00",
    "errors": {
        "Title": [
            "The Title field is required."
        ]
    }
}
```

Sin embargo no parece un lugar adecuado para incluir las validaciones en la aplicación, no en la capa de `Domain`. **Se descarta esta opción.**

##### 102 Validación fluida

En la galería de NuGet buscamos FluentValidation.

Se instala `Fluentvalidation.AspNetCore` en el proyecto `Application`.

```bash
dotnet add /home/joan/e-learning/udemy/reactivities/Application/Application.csproj package FluentValidation.AspNetCore -v 9.5.3 -s https://api.nuget.org/v3/index.json
```

Nos centramos en el método `Createactivity` del `ActivitiesController`. Las validaciones se realizan entre el `Command` y el `Handler` de la clase `Create` en `Application/Activities`.

```c#
using System.Threading;
using System.Threading.Tasks;
using Domain;
using FluentValidation;
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

        public class CommandValidator : AbstractValidator<Activity>
        {
            public CommandValidator()
            {
                RuleFor(x => x.Title).NotEmpty();
            }
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

Hay que inyectar la dependencia en la clase `Startup`.

```c#
public void ConfigureServices(IServiceCollection services)
{
    services.AddControllers().AddFluentValidation(config => {
        config.RegisterValidatorsFromAssemblyContaining<Create>();
    });
    services.AddApplicationServices(_config);
}
```

Como las mismas validaciones se aplican en el momento de crear o editar una actividad, en lugar de aplicarlas a cada operación, se aplicarán directamente a la actividad.

Se crea la clase `ActivityValidator` en `Application/Activities`:

```c#
using Domain;
using FluentValidation;

namespace Application.Activities
{
    public class ActivityValidator : AbstractValidator<Activity>
    {
        public ActivityValidator()
        {
            RuleFor(x => x.Title).NotEmpty();
            RuleFor(x => x.Description).NotEmpty();
            RuleFor(x => x.Date).NotEmpty();
            RuleFor(x => x.Category).NotEmpty();
            RuleFor(x => x.City).NotEmpty();
            RuleFor(x => x.Venue).NotEmpty();
        }
    }
}
```

Las reglas se pueden extender con multitud de opciones.

```c#
using System.Threading;
using System.Threading.Tasks;
using Domain;
using FluentValidation;
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

        public class CommandValidator : AbstractValidator<Command>
        {
            public CommandValidator()
            {
                RuleFor(x => x.Activity).SetValidator(new ActivityValidator);
            }
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

```json
{
    "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
    "title": "One or more validation errors occurred.",
    "status": 400,
    "traceId": "00-df53c875b0bb6f4c9910c1bf5fd882ba-7e7ec2a7614b1843-00",
    "errors": {
        "City": [
            "'City' must not be empty."
        ],
        "Date": [
            "'Date' must not be empty."
        ],
        "Title": [
            "'Title' must not be empty."
        ],
        "Venue": [
            "'Venue' must not be empty."
        ],
        "Category": [
            "'Category' must not be empty."
        ],
        "Description": [
            "'Description' must not be empty."
        ]
    }
}
```

La misma clase `CommandValidator` se define en `Edit`, exactamente igual.

##### 103 Manejar respuestas de error de la API

Se supone el caso de solicitar el detalle de una actividad cuyo id no existe, en postman *Get non existing activity*.

Ahora está devolviendo una respuesta 204 http *No content,* que no es un error.

Se modifica el método `GetActivity` del `ActivitiesController` para evitar que simplemente se devuelva `null` al buscar una actividad por un identificador que no existe.

```c#
[HttpGet("{id}")]
public async Task<ActionResult<Activity>> GetActivity(Guid id)
{
    var activity = await Mediator.Send(new Details.Query {Id = id});

    if (activity == null) return NotFound();

    return activity;
}
```

No se considera una forma apropiada de resolver este tipo de situaciones. Se opta por la solución de que la API, en lugar de devolver una actividad devuelva un objeto resultado, que puede ser error.

El manejo de errores se incluirá en los manipuladores de la aplicación en lugar de en el controlador de la API.

Una forma sería lanzar una excepción.

```c#
public async Task<Activity> Handle(Query request, CancellationToken cancellationToken)
{
    var activity = await _context.Activities.FindAsync(request.Id);

    if (activity == null) throw new Exception("Activity not found");

    return activity;
}
```

Las excepciones cuestan más que las respuestas API, respuestas normales. Es una solución pesada. Se deberían evitar las excepciones para controlar el flujo del programa.

##### 104 Manejar respuestas de error de la API 2ª parte

Se crea la clase `Result`, de tipo genérico, en `Application/Core`.

```c#
namespace Application.Core
{
    public class Result<T>
    {
        public bool IsSuccess { get; set; }
        public T Value { get; set; }
        public string Error { get; set; }

        public static Result<T> Success(T value) => new Result<T> {IsSuccess = true, Value = value};
        public static Result<T> Failure(string error) => new Result<T> {IsSuccess = false, Error = error};
    }
}
```

Se reestructura la clase `Details`.

```c#
using System;
using System.Threading;
using System.Threading.Tasks;
using Application.Core;
using Domain;
using MediatR;
using Persistence;

namespace Application.Activities
{
    public class Details
    {
        public class Query : IRequest<Result<Activity>>
        {
            public Guid Id { get; set; }
        }

        public class Handler : IRequestHandler<Query, Result<Activity>>
        {
            private readonly DataContext _context;
            public Handler(DataContext context)
            {
                _context = context;
            }

            public async Task<Result<Activity>> Handle(Query request, CancellationToken cancellationToken)
            {
                var activity = await _context.Activities.FindAsync(request.Id);

                return Result<Activity>.Success(activity);
            }
        }
    }
}
```

Y se adapta el controlador de la API.

```c#
public async Task<IActionResult<Activity>> GetActivity(Guid id)
{
    var result =  await Mediator.Send(new Details.Query {Id = id});

    if (result.IsSuccess && result.Value != null)
        return Ok(result.Value);
    if (result.IsSuccess && result.Value == null)
        return NotFound();
    return BadRequest(result.Error);
}
```

El manejo del resultado se lleva a la clase base del controlador para no tener que repetir esta lógica en cada operación.

##### 105 Manejar respuestas de error de la API 3ª parte

Se revisan todas las operaciones del controlador para devolver un `Result` de tipo `Unit`, incluso en el caso de `Command`, que hasta ahora no devolvían nada.

##### 106 Manejar respuestas de error de la API 4ª parte

Continúa la revisión con las operaciones `Edit` y `Delete`. Ambas afectan a una actividad que tiene que existir, el parámetro identificador debe ser válido.

Hay que ajustar `HandleResult` de `BaseApiController` para manejar el caso de que el resultado sea nulo.

En el caso de Edit es curioso que editar una actividad sin cambiar ninguno de sus atributos, es decir sin cambios, se trate como un error.

```json
{
	"title": "Test Create Activity updated",
	"description": "Description of the test event",
	"category": "Culture",
	"date": "2021-03-31T07:54:00.29",
	"city": "London",
	"venue": "Tower of London"
}
```

```
400 Bad Request
Failed to edit the activity
```

##### 107 Manejar excepciones

Se prepara `Delete` para provocar una excepción en caso de que el identificador especificado no exista.

```c#
public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
{
    var activity = await _context.Activities.FindAsync(request.Id);

    //if (activity == null) return null;

    _context.Remove(activity); // provoca una excepción con 500 Internal Server Error

    var result = await _context.SaveChangesAsync() > 0;

    if (!result) return Result<Unit>.Failure("Failed to delete the activity");

    return Result<Unit>.Success(Unit.Value);
}
```

Hay que tener en cuenta que la operación se está ejecutando en un entorno de desarrollo y que el tratamiento de excepciones no será igual en producción. En `Startup`:

```c#
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    if (env.IsDevelopment())
    {
        app.UseDeveloperExceptionPage(); // <-- Importante!
        app.UseSwagger();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "API v1"));
    }

    // app.UseHttpsRedirection();

    app.UseRouting();

    app.UseCors("CorsPolicy");

    app.UseAuthorization();

    app.UseEndpoints(endpoints =>
    {
        endpoints.MapControllers();
    });
}
```

Se crea `AppException` en `Application/Core`.

```c#
namespace Application.Core
{
    public class AppException
    {
        public AppException(int statusCode, string message, string details = null)
        {
            StatusCode = statusCode;
            Message = message;
            Details = details;
        }

        public int StatusCode { get; set; }
        public string Message { get; set; }
        public string Details { get; set; }
    }
}
```

https://docs.microsoft.com/en-us/aspnet/core/fundamentals/middleware/?view=aspnetcore-5.0

> Middleware is software that's assembled into an app pipeline to handle requests and responses. Each component:
>
> - Chooses whether to pass the request to the next component in the pipeline.
> - Can perform work before and after the next component in the pipeline.
>
> Request delegates are used to build the request pipeline. The request delegates handle each HTTP request.

Se crea la clase `ExceptionMiddleware`.

```c#
using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Application.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace API.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _env;
        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger,
            IHostEnvironment env)
        {
            this._env = env;
            this._logger = logger;
            this._next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ex.Message);
                context.Response.ContentType = "application/json";
                context.Response.StatusCode = (int) HttpStatusCode.InternalServerError;

                var response = _env.IsDevelopment()
                    ? new AppException(context.Response.StatusCode, ex.Message, ex.StackTrace?.ToString())
                    : new AppException(context.Response.StatusCode, "Server Error");

                var options = new JsonSerializerOptions{PropertyNamingPolicy = JsonNamingPolicy.CamelCase};

                var json = JsonSerializer.Serialize(response, options);

                await context.Response.WriteAsync(json);
            }
        }
    }
}
```

Se adapta `Startup` para usar el *middleware*.

Ahora la respuesta es más manejable, en formato *json*, incluso tratándose de una excepción.

```json
{
    "statusCode": 500,
    "message": "Value cannot be null. (Parameter 'entity')",
    "details": "   at Microsoft.EntityFrameworkCore.Utilities.Check.NotNull[T](T value, String parameterName)\n   at Microsoft.EntityFrameworkCore.DbContext.Remove[TEntity](TEntity entity)\n   at Application.Activities.Delete.Handler.Handle(Command request, CancellationToken cancellationToken) in /home/joan/e-learning/udemy/reactivities/Application/Activities/Delete.cs:line 31\n   at MediatR.Pipeline.RequestExceptionProcessorBehavior`2.Handle(TRequest request, CancellationToken cancellationToken, RequestHandlerDelegate`1 next)\n   at..."
}
```

##### 108 Preparándose para configurar el manejo de errores en el cliente de la aplicación

Se usa un nuevo controlador de pruebas, con los diferentes tipos de error previstos, y un componente que los genera, llamando al controlador mediante botones.

Para mostrar los errores se usará un `Toaster`.

```bash
[joan@alkaid client-app]$ npm install react-toastify
```

```tsx
import React from 'react';
import { Container } from 'semantic-ui-react';
import NavBar from './NavBar';
import ActivityDashboard from '../../features/activities/dashboard/ActivityDashboard';
import { observer } from 'mobx-react-lite';
import { Route, useLocation } from 'react-router';
import HomePage from '../../features/home/HomePage';
import ActivityForm from '../../features/activities/form/ActivityForm';
import ActivityDetails from '../../features/activities/details/ActivityDetails';
import TestErrors from '../../features/errors/TestError';
import { ToastContainer } from 'react-toastify';

function App() {
  const location = useLocation();

  // </> equival a emprar <Fragment/>
  return (
    <>
      <ToastContainer position='bottom-right' hideProgressBar />
      <Route exact path='/' component={HomePage} />
      <Route
        path={'/(.+)'}
        render={() => (
          <>
            <NavBar />
            <Container style={{ marginTop: '7em' }}>
              <Route exact path='/activities' component={ActivityDashboard} />
              <Route path='/activities/:id' component={ActivityDetails} />
              <Route key={location.key} path={['/createActivity', '/manage/:id']} component={ActivityForm} />
              <Route path='/errors' component={TestErrors} />
            </Container>
          </>
        )}
      />
    </>
  );
}

export default observer(App);
```

Además se importan los estilos en `index.tsx`.

##### 109 Usar un interceptor para manejar las respuestas de error de la API

Se adapta el interceptor en `agent.ts`. Todo lo que no sea un 200 se considera como **rechazado**.

```tsx
import axios, { AxiosError, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { Activity } from '../models/activity';

const sleep = (delay: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, delay);
    })
}

axios.defaults.baseURL = 'http://localhost:5000/api';

axios.interceptors.response.use(async response => {
    await sleep(1000);
    return response;
}, (error: AxiosError) => {
    const {data, status} = error.response!;
    switch (status) {
        case 400:
            toast.error('bad request');
            break;
        case 401:
            toast.error('unauthorised');
            break;
        case 404:
            toast.error('not found');
            break;
        case 500:
            toast.error('server error');
            break;
    }
    return Promise.reject(error);
})

const responseBody = <T>(response: AxiosResponse<T>) => response.data;

const requests = {
    get: <T>(url: string) => axios.get<T>(url).then(responseBody),
    post: <T>(url: string, body: {}) => axios.post<T>(url, body).then(responseBody),
    put: <T>(url: string, body: {}) => axios.put<T>(url, body).then(responseBody),
    del: <T>(url: string) => axios.delete<T>(url).then(responseBody)
}

const Activities = {
    list: () => requests.get<Activity[]>('/activities'),
    details: (id: string) => requests.get<Activity>(`/activities/${id}`),
    create: (activity: Activity) => requests.post<void>('/activities', activity),
    update: (activity: Activity) => requests.put<void>(`/activities/${activity.id}`, activity),
    delete: (id: string) => requests.del<void>(`/activities/${id}`)
}

const agent = {
    Activities
}

export default agent;
```

##### 110 Añadir un componente 'no encontrado'

![](/home/joan/e-learning/udemy/reactivities/doc/images/101.1.png)

se monta un componente `NotFound`:

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Header, Icon, Segment } from 'semantic-ui-react';

export default function NotFound() {
    return (
        <Segment placeholder>
            <Header icon>
                <Icon name='search' />
                Oops - we've looked everywhere and could not find this.
            </Header>
            <Segment.Inline>
                <Button as={Link} to='/activities' primary>
                    Return to activities page
                </Button>
            </Segment.Inline>
        </Segment>
    )
}
```

La complejidad radica en definir una ruta para el componente. Se utiliza el historial para redirigir el flujo hacia el componente, a través de la ruta definida en `App`. Ha sido necesario adaptar `index.tsx` para dar acceso al historial en `agent.ts`.

##### 111 Manejar errores 400

El objetivo es distinguir un error de validación de campos en la API de un error 400  general.

```tsx
axios.interceptors.response.use(async response => {
    await sleep(1000);
    return response;
}, (error: AxiosError) => {
    const {data, status} = error.response!;
    switch (status) {
        case 400:
            //toast.error('bad request');
            if (data.errors) { // es un error de validación
                const modalStateErrors = [];
                for (const key in data.errors) {
                    if (data.errors[key]) {
                        modalStateErrors.push(data.errors[key]);
                    }
                }
                throw modalStateErrors.flat();
            } else {
                toast.error(data);
            }
            break;
        case 401:
            toast.error('unauthorised');
            break;
        case 404:
            //toast.error('not found');
            history.push('/not-found');
            break;
        case 500:
            toast.error('server error');
            break;
    }
    return Promise.reject(error);
})
```

Se crea un componente `ValidationErrors` para mostrar los errores de validación.

##### 112 Manejar errores 500 en el cliente

Se crea una interfaz que representa el mensaje de error. Es necesario utilizar un store MobX específico para manejar el error y se crea un componente `ServerError` para su presentación

##### 113 Manejar el error de validación de un GUID inválido

Se trata como un 'no encontrado', en `agent.ts`. Es un error de validación.

Se procede a restaurar la base de datos.

```bash
[joan@alkaid reactivities]$ dotnet ef database drop -s API/ -p Persistence/
Build started...
Build succeeded.
info: Microsoft.EntityFrameworkCore.Infrastructure[10403]
      Entity Framework Core 5.0.3 initialized 'DataContext' using provider 'Microsoft.EntityFrameworkCore.Sqlite' with options: None
Are you sure you want to drop the database 'main' on server 'reactivities.db'? (y/N)
y
info: Microsoft.EntityFrameworkCore.Infrastructure[10403]
      Entity Framework Core 5.0.3 initialized 'DataContext' using provider 'Microsoft.EntityFrameworkCore.Sqlite' with options: None
Dropping database 'main' on server 'reactivities.db'.
Successfully dropped database 'main'.
```

##### 114 Sumario de la sección 10

#### Sección 11: Formularios

##### 115 Introducción

* Formularios con Formik
* Validación con Formik/Yup
* Crear entradas de formulario reutilizables

##### 116 Configurar Formik

https://formik.org/

> Formik is the world's most popular open source form library for React and React Native.

```bash
[joan@alkaid client-app]$ npm install formik

added 4 packages, and audited 2017 packages in 5s
```

Básicamente se va a modificar el componente `ActivityForm`.

```tsx
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import { Button, Form, Segment } from 'semantic-ui-react';
import LoadingComponent from '../../../app/layout/LoadingComponent';
import { useStore } from '../../../app/stores/store';
import { v4 as uuid } from 'uuid';
import { Link } from 'react-router-dom';

export default observer(function ActivityForm() {
    const history = useHistory();
    const { activityStore } = useStore();
    const { createActivity, updateActivity, loading, loadActivity, loadingInitial } = activityStore;
    const { id } = useParams<{ id: string }>();

    const [activity, setActivity] = useState({
        id: '',
        title: '',
        category: '',
        description: '',
        date: '',
        city: '',
        venue: ''
    });

    useEffect(() => {
        if (id) loadActivity(id).then(activity => setActivity(activity!));
    }, [id, loadActivity]);

    function handleSubmit() {
        //activity.id ? updateActivity(activity) : createActivity(activity);
        if (activity.id.length === 0) {
            let newActivity = {
                ...activity,
                id: uuid()
            };
            createActivity(newActivity).then(() => history.push(`/activities/${newActivity.id}`));
        } else {
            updateActivity(activity).then(() => history.push(`/activities/${activity.id}`));
        }
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = event.target;
        setActivity({ ...activity, [name]: value });
    }

    if (loadingInitial) return <LoadingComponent content='Loading activityy---' />

    return (
        <Segment clearing>
            <Form onSubmit={handleSubmit} autoComplete='off'>
                <Form.Input placeholder='Title' value={activity.title} name='title' onChange={handleInputChange} />
                <Form.TextArea placeholder='Description' value={activity.description} name='description' onChange={handleInputChange} />
                <Form.Input placeholder='Category' value={activity.category} name='category' onChange={handleInputChange} />
                <Form.Input type='date' placeholder='Date' value={activity.date} name='date' onChange={handleInputChange} />
                <Form.Input placeholder='City' value={activity.city} name='city' onChange={handleInputChange} />
                <Form.Input placeholder='Venue' value={activity.venue} name='venue' onChange={handleInputChange} />
                <Button loading={loading} floated='right' positive type='submit' content='Submit' />
                <Button as={Link} to='/activities' floated='right' type='button' content='Cancel' />
            </Form>
        </Segment>
    )
})
```

Utilizando Formik:

```tsx
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import { Button, Form, Segment } from 'semantic-ui-react';
import LoadingComponent from '../../../app/layout/LoadingComponent';
import { useStore } from '../../../app/stores/store';
import { v4 as uuid } from 'uuid';
import { Link } from 'react-router-dom';
import { Formik } from 'formik';

export default observer(function ActivityForm() {
    const history = useHistory();
    const { activityStore } = useStore();
    const { createActivity, updateActivity, loading, loadActivity, loadingInitial } = activityStore;
    const { id } = useParams<{ id: string }>();

    const [activity, setActivity] = useState({
        id: '',
        title: '',
        category: '',
        description: '',
        date: '',
        city: '',
        venue: ''
    });

    useEffect(() => {
        if (id) loadActivity(id).then(activity => setActivity(activity!));
    }, [id, loadActivity]);

    // function handleSubmit() {
    //     //activity.id ? updateActivity(activity) : createActivity(activity);
    //     if (activity.id.length === 0) {
    //         let newActivity = {
    //             ...activity,
    //             id: uuid()
    //         };
    //         createActivity(newActivity).then(() => history.push(`/activities/${newActivity.id}`));
    //     } else {
    //         updateActivity(activity).then(() => history.push(`/activities/${activity.id}`));
    //     }
    // }

    // function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    //     const { name, value } = event.target;
    //     setActivity({ ...activity, [name]: value });
    // }

    if (loadingInitial) return <LoadingComponent content='Loading activityy---' />

    return (
        <Segment clearing>
            <Formik enableReinitialize initialValues={activity} onSubmit={values => console.log(values)}>
                {({ values: activity, handleChange, handleSubmit }) => (
                    <Form onSubmit={handleSubmit} autoComplete='off'>
                        <Form.Input placeholder='Title' value={activity.title} name='title' onChange={handleChange} />
                        <Form.TextArea placeholder='Description' value={activity.description} name='description' onChange={handleChange} />
                        <Form.Input placeholder='Category' value={activity.category} name='category' onChange={handleChange} />
                        <Form.Input type='date' placeholder='Date' value={activity.date} name='date' onChange={handleChange} />
                        <Form.Input placeholder='City' value={activity.city} name='city' onChange={handleChange} />
                        <Form.Input placeholder='Venue' value={activity.venue} name='venue' onChange={handleChange} />
                        <Button loading={loading} floated='right' positive type='submit' content='Submit' />
                        <Button as={Link} to='/activities' floated='right' type='button' content='Cancel' />
                    </Form>
                )}
            </Formik>
        </Segment>
    )
})
```

##### 117 Formik con menos código

Se sustituye el componente `Form` de `Semantic-UI` por el de `Formik`, manteniendo los estilos del primero en éste. Al utilizar componentes `Field` ya no son necesarios `value` ni `onChange`.

##### 118 Validación en Formik

```bash
[joan@alkaid client-app]$ npm install yup
[joan@alkaid client-app]$ npm install @types/yup --save-dev
```

```tsx
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import { Button, FormField, Label, Segment } from 'semantic-ui-react';
import LoadingComponent from '../../../app/layout/LoadingComponent';
import { useStore } from '../../../app/stores/store';
import { v4 as uuid } from 'uuid';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

export default observer(function ActivityForm() {
    const history = useHistory();
    const { activityStore } = useStore();
    const { createActivity, updateActivity, loading, loadActivity, loadingInitial } = activityStore;
    const { id } = useParams<{ id: string }>();

    const [activity, setActivity] = useState({
        id: '',
        title: '',
        category: '',
        description: '',
        date: '',
        city: '',
        venue: ''
    });

    const validationSchema = Yup.object({
        title: Yup.string().required('The activity title is requrired')
    })

    useEffect(() => {
        if (id) loadActivity(id).then(activity => setActivity(activity!));
    }, [id, loadActivity]);

    // function handleSubmit() {
    //     //activity.id ? updateActivity(activity) : createActivity(activity);
    //     if (activity.id.length === 0) {
    //         let newActivity = {
    //             ...activity,
    //             id: uuid()
    //         };
    //         createActivity(newActivity).then(() => history.push(`/activities/${newActivity.id}`));
    //     } else {
    //         updateActivity(activity).then(() => history.push(`/activities/${activity.id}`));
    //     }
    // }

    // function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    //     const { name, value } = event.target;
    //     setActivity({ ...activity, [name]: value });
    // }

    if (loadingInitial) return <LoadingComponent content='Loading activityy---' />

    return (
        <Segment clearing>
            <Formik
                validationSchema={validationSchema}
                enableReinitialize
                initialValues={activity}
                onSubmit={values => console.log(values)}
            >
                {({ handleSubmit }) => (
                    <Form className='ui form' onSubmit={handleSubmit} autoComplete='off'>
                        <FormField>
                            <Field placeholder='Title' name='title' />
                            <ErrorMessage name='title'
                                render={error => <Label basic color='red' content={error} />} />
                        </FormField>

                        <Field placeholder='Description' name='description' />
                        <Field placeholder='Category' name='category' />
                        <Field type='date' placeholder='Date' name='date' />
                        <Field placeholder='City' name='city' />
                        <Field placeholder='Venue' name='venue' />
                        <Button loading={loading} floated='right' positive type='submit' content='Submit' />
                        <Button as={Link} to='/activities' floated='right' type='button' content='Cancel' />
                    </Form>
                )}
            </Formik>
        </Segment>
    )
})
```

##### 119 Crear una entrada de texto reutilizable

Es conveniente consultar la documentación `Formik` acerca de este tema.

Se crea un componente `MyTextInput` que reproduce la funcionalidad experimentada en el título del apartado anterior.

```tsx
import { useField } from 'formik';
import React from 'react';
import { Form, Label } from 'semantic-ui-react';

interface Props {
    placeholder: string;
    name: string;
    label?: string;
}

export default function MyTextInput(props: Props) {
    const [field, meta] = useField(props.name);
    return (
        <Form.Field error={meta.touched && !!meta.error}>
            <label>{props.label}</label>
            <input {...field} {...props} />
            {meta.touched && meta.error ? (
                <Label basic color='red'>{meta.error}</Label>
            ) : null}
        </Form.Field>
    )
}
```

Este componente se usa para definir el formulario.

```tsx
import { observer } from 'mobx-react-lite';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router';
import { Button, Label, Segment } from 'semantic-ui-react';
import LoadingComponent from '../../../app/layout/LoadingComponent';
import { useStore } from '../../../app/stores/store';
import { v4 as uuid } from 'uuid';
import { Link } from 'react-router-dom';
import { Formik, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import MyTextInput from '../../../app/common/form/MyTextInput';

export default observer(function ActivityForm() {
    const history = useHistory();
    const { activityStore } = useStore();
    const { createActivity, updateActivity, loading, loadActivity, loadingInitial } = activityStore;
    const { id } = useParams<{ id: string }>();

    const [activity, setActivity] = useState({
        id: '',
        title: '',
        category: '',
        description: '',
        date: '',
        city: '',
        venue: ''
    });

    const validationSchema = Yup.object({
        title: Yup.string().required('The activity title is requrired'),
        description: Yup.string().required('The activity description is requrired'),
        category: Yup.string().required(),
        date: Yup.string().required(),
        city: Yup.string().required(),
        venue: Yup.string().required()
    })

    useEffect(() => {
        if (id) loadActivity(id).then(activity => setActivity(activity!));
    }, [id, loadActivity]);

    // function handleSubmit() {
    //     //activity.id ? updateActivity(activity) : createActivity(activity);
    //     if (activity.id.length === 0) {
    //         let newActivity = {
    //             ...activity,
    //             id: uuid()
    //         };
    //         createActivity(newActivity).then(() => history.push(`/activities/${newActivity.id}`));
    //     } else {
    //         updateActivity(activity).then(() => history.push(`/activities/${activity.id}`));
    //     }
    // }

    // function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    //     const { name, value } = event.target;
    //     setActivity({ ...activity, [name]: value });
    // }

    if (loadingInitial) return <LoadingComponent content='Loading activityy---' />

    return (
        <Segment clearing>
            <Formik
                validationSchema={validationSchema}
                enableReinitialize
                initialValues={activity}
                onSubmit={values => console.log(values)}
            >
                {({ handleSubmit }) => (
                    <Form className='ui form' onSubmit={handleSubmit} autoComplete='off'>
                        <MyTextInput placeholder='Title' name='title' />
                        <MyTextInput placeholder='Description' name='description' />
                        <MyTextInput placeholder='Category' name='category' />
                        <MyTextInput placeholder='Date' name='date' />
                        <MyTextInput placeholder='City' name='city' />
                        <MyTextInput placeholder='Venue' name='venue' />
                        <Button loading={loading} floated='right' positive type='submit' content='Submit' />
                        <Button as={Link} to='/activities' floated='right' type='button' content='Cancel' />
                    </Form>
                )}
            </Formik>
        </Segment>
    )
})
```

##### 120 Crear un área de texto reutilizable

Es prácticamente igual a `MyTextInput`.

##### 121 Crear un selector reutilizable

https://react.semantic-ui.com/addons/select/

Al utilizar un componente Semantic-UI es necesario escribir más código. Además hay que preparar la lista de opciones seleccionables.

```tsx
import { useField } from 'formik';
import React from 'react';
import { Form, Label, Select } from 'semantic-ui-react';

interface Props {
    placeholder: string;
    name: string;
    options: any;
    label?: string;
}

export default function MySelectInput(props: Props) {
    const [field, meta, helpers] = useField(props.name);
    return (
        <Form.Field error={meta.touched && !!meta.error}>
            <label>{props.label}</label>
            <Select
                clearable
                options={props.options}
                value={field.value || null}
                onChange={(e, d) => helpers.setValue(d.value)}
                onBlur={() => helpers.setTouched(true)}
                placeholder={props.placeholder}
            />
            {meta.touched && meta.error ? (
                <Label basic color='red'>{meta.error}</Label>
            ) : null}
        </Form.Field>
    )
}
```



##### 122 Crear una entrada de fecha reutilizable

https://reactdatepicker.com/

```bash
[joan@alkaid client-app]$ npm install react-datepicker
[joan@alkaid client-app]$ npm install @types/react-datepicker --save-dev
client-app@0.1.0 /home/joan/e-learning/udemy/reactivities/client-app
└── react-datepicker@3.6.0
```

Se incluyen los estilos en `index.tsx.`

También es necesario ajustar estilos en `styles.css`.

El campo que ahora se envía es un `Date`:

```json
Date Fri Mar 19 2021 12:00:00 GMT+0100 (Hora estàndard del Centre d’Europa)
```

##### 123 La estrategia de fecha

Hay que ser consistentes en toda la aplicación.

* Al obtener la fecha de la base de datos se tiene que crear un objeto de tipo `Date`.
* Cuando se modifica el campo date de `Activity` de `string` a `Date` se producen diversos errores, tanto en activityStore como en ActivityForm, que se corrigen.

Aún así se produce un error al consultar la lista de actividades:

```html
Error: Objects are not valid as a React child (found: Sun Jan 17 2021 14:41:57 GMT+0100 (Hora estàndard del Centre d’Europa)). If you meant to render a collection of children, use an array instead.
```

No se pueden mostrar fechas en React, se tienen que mostrar cadenas.

##### 124 Usar Date-FNS

```bash
[joan@alkaid client-app]$ npm ls date-fns
client-app@0.1.0 /home/joan/e-learning/udemy/reactivities/client-app
├─┬ @types/react-datepicker@3.1.8
│ └── date-fns@2.19.0
└─┬ react-datepicker@3.6.0
  └── date-fns@2.19.0 deduped
[joan@alkaid client-app]$ npm install date-fns@2.19.0
```

https://date-fns.org/

Hay que revisar todos los puntos de la aplicación en los que se muestra una fecha y formatearla.

##### 125 Conectando el envío del formulario a Formik

##### 126 Sumario de la sección 11

> Validation on the server - essential
>
> Validation on the client - nice to have

#### Sección 12: Identidad

##### 127 Introducción

* ASPNET Core Identity
  * Membership system
  * Supports login stored in Identity
  * Supports externals providers
  * Comes with default stores
  * UserManager
  * SignInManager
* JWT Token Authentication
* Login/Register
* Authenticated Requests

El sistema de Identificación se considera una pieza aparte de la aplicación, fuera del ámbito de negocio.

##### 128 Añadir una entidad usuario

Toda la lógica de identidades se mantiene en la capa `API` (a diferencia de cómo se hizo en la última versión del curso que se hacía en `Application`).

Buscar en la galería NuGet microsoft.aspnetcore.identity para instalar el paquete `Microsoft.AspNetCore.Identity.EntityFrameworkCore` en el proyecto `Domain`.

```bash
dotnet add /home/joan/e-learning/udemy/reactivities/Domain/Domain.csproj package Microsoft.AspNetCore.Identity.EntityFrameworkCore -v 5.0.4 -s https://api.nuget.org/v3/index.json
```

Se añaden propiedades adicionales para `AppUser`. La mayoría los hereda de `IdentityUser` (UserName, Email, etc).

##### 129 Añadir un `IdentityDbContext`

De momento tenemos:

```c#
using Domain;
using Microsoft.EntityFrameworkCore;

namespace Persistence
{
    public class DataContext : DbContext
    {
        public DataContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<Activity> Activities { get; set; }
    }
}
```

Se adapta para el uso de `Identity`.

```c#
using Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Persistence
{
    public class DataContext : IdentityDbContext<AppUser>
    {
        public DataContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<Activity> Activities { get; set; }
    }
}
```

Se prepara una migración. Es importante parar la ejecución de la aplicación.

```bash
[joan@alkaid reactivities]$ dotnet ef migrations add IdentityAdded -p Persistence -s API
Build started...
Build succeeded.
The Entity Framework tools version '5.0.3' is older than that of the runtime '5.0.4'. Update the tools for the latest features and bug fixes.
info: Microsoft.EntityFrameworkCore.Infrastructure[10403]
      Entity Framework Core 5.0.4 initialized 'DataContext' using provider 'Microsoft.EntityFrameworkCore.Sqlite' with options: None
Done. To undo this action, use 'ef migrations remove'
```

Se crean muchas tablas de infraestructura entre ellas `AspNetUsers`, que incluye las columnas `DisplayName` y `Bio` que hemos definido:

```c#
migrationBuilder.CreateTable(
     name: "AspNetUsers",
     columns: table => new
     {
         Id = table.Column<string>(type: "TEXT", nullable: false),
         DisplayName = table.Column<string>(type: "TEXT", nullable: true),
         Bio = table.Column<string>(type: "TEXT", nullable: true),
         UserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
         NormalizedUserName = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
         Email = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
         NormalizedEmail = table.Column<string>(type: "TEXT", maxLength: 256, nullable: true),
         EmailConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
         PasswordHash = table.Column<string>(type: "TEXT", nullable: true),
         SecurityStamp = table.Column<string>(type: "TEXT", nullable: true),
         ConcurrencyStamp = table.Column<string>(type: "TEXT", nullable: true),
         PhoneNumber = table.Column<string>(type: "TEXT", nullable: true),
         PhoneNumberConfirmed = table.Column<bool>(type: "INTEGER", nullable: false),
         TwoFactorEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
         LockoutEnd = table.Column<DateTimeOffset>(type: "TEXT", nullable: true),
         LockoutEnabled = table.Column<bool>(type: "INTEGER", nullable: false),
         AccessFailedCount = table.Column<int>(type: "INTEGER", nullable: false)
     },
     constraints: table =>
     {
         table.PrimaryKey("PK_AspNetUsers", x => x.Id);
     });
```

##### 130 Configurar `Identity` en la clase `Startup`

Se crea una extensión de `IServicesCollection` para configurar `Identity`.

```c#
using Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Persistence;

namespace API.Extensions
{
    public static class IdentityServiceExtensions
    {
        public static IServiceCollection AddIdentityServices(this IServiceCollection services, IConfiguration config)
        {
            services.AddIdentityCore<AppUser>(opt => {
                // Identity utiliza unas opciones por defecto que se pueden configurar. Por ejemplo:
                opt.Password.RequireNonAlphanumeric = false;
            })
            .AddEntityFrameworkStores<DataContext>()
            .AddSignInManager<SignInManager<AppUser>>();

            services.AddAuthentication();

            return services;
        }
    }
}
```

Se registran la extensión en `Startup`.

```c#
public void ConfigureServices(IServiceCollection services)
{
    services.AddControllers().AddFluentValidation(config => {
        config.RegisterValidatorsFromAssemblyContaining<Create>();
    });
    services.AddApplicationServices(_config);
    services.AddIdentityServices(_config); // <-- Identity
}
```

##### 131 Añadir usuarios semilla

Se añade la creación de 3 usuarios en `Seed`, Bob, Tom y Jane, con la misma Pa$$w0rd. Se modifica `Main` para pasar `UserManager` al método `SeedData`.

![](/home/joan/e-learning/udemy/reactivities/doc/images/131.1.png)

##### 132 Crear los DTOs de usuario (Data Transfer Object)

> In the field of programming a **data transfer object** (**DTO**[[1\]](https://en.wikipedia.org/wiki/Data_transfer_object#cite_note-msdn-1)[[2\]](https://en.wikipedia.org/wiki/Data_transfer_object#cite_note-fowler-2)) is an object that carries data between processes. The motivation for  its use is that communication between processes is usually done  resorting to remote interfaces (e.g., web services), where each call is  an expensive operation.[[2\]](https://en.wikipedia.org/wiki/Data_transfer_object#cite_note-fowler-2) Because the majority of the cost of each call is related to the  round-trip time between the client and the server, one way of reducing  the number of calls is to use an object (the DTO) that aggregates the  data that would have been transferred by the several calls, but that is  served by one call only.[[2\]](https://en.wikipedia.org/wiki/Data_transfer_object#cite_note-fowler-2)

Se crean 4 clases en `API/DTOs`.

##### 133 Añadir un controlador de cuentas

No se va a usar MediatR para este aspecto de la aplicación.

```c#
using System.Threading.Tasks;
using API.DTOs;
using Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        public AccountController(UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager)
        {
            this._signInManager = signInManager;
            this._userManager = userManager;

        }

        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);

            if (user == null) return Unauthorized();

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

            if (result.Succeeded)
            {
                return new UserDto
                {
                    DisplayName = user.DisplayName,
                    Image = null,
                    Token = "This will be a token",
                    Username = user.UserName
                };
            }

            return Unauthorized();
        }
    }
}
```

Normalmente después de añadir un nuevo controlador a la aplicación hay que reiniciarla.

##### 134 JSON Web Tokens (JWT)

https://jwt.io/

Son cadenas de texto con 3 partes, separadas por un punto: 

* cabecera,
* carga útil y
* verificación de firma.

En la carga útil o *payload* se incluyen reclamaciones, para nada información confidencial.

##### 135 Crear un servicio de fichas (token)

```bash
dotnet add /home/joan/e-learning/udemy/reactivities/API/API.csproj package Microsoft.IdentityModel.Tokens -v 6.9.0 -s https://api.nuget.org/v3/index.json

dotnet add /home/joan/e-learning/udemy/reactivities/API/API.csproj package System.IdentityModel.Tokens.Jwt -v 6.9.0 -s https://api.nuget.org/v3/index.json
```

La clave que se usa en el servicio de fichas nunca sale del servidor.

```c#
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Domain;
using Microsoft.IdentityModel.Tokens;

namespace API.Services
{
    public class TokenService
    {
        public string CreateToken(AppUser user)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("super secret key"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(7),
                SigningCredentials = creds
            }

            var tokenHandler = new JwtSecurityTokenHandler();

            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}
```

El servicio creado se tiene que inyectar en el controlador de cuentas.

##### 136 Autenticarse en la aplicación

```bash
dotnet add /home/joan/e-learning/udemy/reactivities/API/API.csproj package Microsoft.AspNetCore.Authentication.JwtBearer -v 5.0.4 -s https://api.nuget.org/v3/index.json
```

> bearer n    (bringer: of news)    portador, portadora nm, nf
>                                                        mensajero, mensajera nm, nf

Se configura `services.AddAuthentication` en `IdentityServiceExtensions`.

```c#
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("super secret key"));

services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key,
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });
```

Se añade `app.UseAuthentication()` en `Startup`. Es importante hacerlo antes de `app.UseAuthorization()`.

En los puntos finales del controlador hay que indicar que usan autorización.

```c#
[Authorize]
[HttpGet("{id}")]
public async Task<IActionResult> GetActivity(Guid id)
{
    return HandleResult(await Mediator.Send(new Details.Query {Id = id}));
}
```

![](/home/joan/e-learning/udemy/reactivities/doc/images/136.1.png)

##### 137 Guardando secretos en desarrollo

Server environment variables: `appSettings.Development.json` y `appSettings.json`.

https://docs.microsoft.com/en-us/aspnet/core/security/app-secrets?view=aspnetcore-5.0&tabs=linux

Es necesario inyectar la configuración en `TokenService`.

##### 138 Crear una política de autorización

Para que la autorización se aplique por defecto, no explicitamente.

En `Startup`:

```c#
public void ConfigureServices(IServiceCollection services)
{
    services.AddControllers(opt => {
        var policy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build();
        opt.Filters.Add(new AuthorizeFilter(policy));
    })
        .AddFluentValidation(config =>
        {
            config.RegisterValidatorsFromAssemblyContaining<Create>();
        });
    services.AddApplicationServices(_config);
    services.AddIdentityServices(_config);
}
```

Para evitar que el punto final `login` requiera autorización se marca como `[AllowAnonymous]` el controlador.

##### 139 Registrar nuevos usuarios

Se crea un nuevo punto final en el controlador de cuentas

```c#
[HttpPost("register")]
public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
{
    if (await _userManager.Users.AnyAsync(u => u.Email == registerDto.Email))
    {
        return BadRequest("Email taken");
    }

    if (await _userManager.Users.AnyAsync(u => u.UserName == registerDto.Username))
    {
        return BadRequest("Username taken");
    }

    var user = new AppUser
    {
        DisplayName = registerDto.DisplayName,
        Email = registerDto.Email,
        UserName = registerDto.Username
    };

    var result = await _userManager.CreateAsync(user, registerDto.Password);

    if (result.Succeeded)
    {
        return new UserDto
        {
            DisplayName = user.DisplayName,
            Image = null,
            Token = _tokenService.CreateToken(user),
            Username = user.UserName
        };
    }

    return BadRequest("Problem registering user");
}
```

El problema es que tenemos un error excesivamente genérico en caso de que el registro falle. Puede ser, por ejemplo, por usar una clave demasiado débil, que no se ajuste a las políticas establecidas.

##### 140 Validar el registro de usuarios

En lugar de usar `FluentValidation` como en el resto de la aplicación, en el caso de la gestión de cuentas se usarán anotaciones en `RegisterDto`, para simplificar.

```c#
using System.ComponentModel.DataAnnotations;

namespace API.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string DisplayName { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [RegularExpression("(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{4,8}$", ErrorMessage = "Password must be complex")]
        public string Password { get; set; }

        [Required]
        public string Username { get; set; }
    }
}
```

##### 141 Obtener el usuario actual

```c#
using System.Security.Claims;
using System.Threading.Tasks;
using API.DTOs;
using API.Services;
using Domain;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace API.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/[controller]")]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly TokenService _tokenService;
        public AccountController(UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager, TokenService tokenService)
        {
            this._tokenService = tokenService;
            this._signInManager = signInManager;
            this._userManager = userManager;
        }

        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login(LoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);

            if (user == null) return Unauthorized();

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

            if (result.Succeeded)
            {
                return CreateUserObject(user);
            }

            return Unauthorized();
        }

        [HttpPost("register")]
        public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
        {
            if (await _userManager.Users.AnyAsync(u => u.Email == registerDto.Email))
            {
                return BadRequest("Email taken");
            }

            if (await _userManager.Users.AnyAsync(u => u.UserName == registerDto.Username))
            {
                return BadRequest("Username taken");
            }

            var user = new AppUser
            {
                DisplayName = registerDto.DisplayName,
                Email = registerDto.Email,
                UserName = registerDto.Username
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (result.Succeeded)
            {
                return CreateUserObject(user);
            }

            return BadRequest("Problem registering user");
        }

        [Authorize]
        [HttpGet]
        public async Task<ActionResult<UserDto>> GetCurrentUser()
        {
            var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));

            return CreateUserObject(user);
        }

        private UserDto CreateUserObject(AppUser user)
        {
            return new UserDto
            {
                DisplayName = user.DisplayName,
                Image = null,
                Token = _tokenService.CreateToken(user),
                Username = user.UserName
            };
        }
    }
}
```

##### 142 Sumario de la sección 12

#### Sección 13: Inicio de sesión y registro en la parte de cliente

##### 143 Introducción

* Interceptores Axios
* Reacciones MobX
* Errores de envío de formulario
* Modales

##### 144 Crear un formulario de inicio de sesión

En este momento la aplicación ha quedado sin funcionalidad debido a la necesidad de identificarse en la API. No se puede obtener la lista de actividades.

Como solución alternativa y temporal se pueden usar anotaciones en el controlador de actividades `[AllowAnonimous]`.

Se define el formulario, inicialmente muy simple.

```tsx
import { Form, Formik } from 'formik';
import React from 'react';
import { Button } from 'semantic-ui-react';
import MyTextInput from '../../app/common/form/MyTextInput';

export default function LoginForm() {
    return (
        <Formik
            initialValues={{ email: '', password: '' }}
            onSubmit={values => console.log(values)}
        >
            {({handleSubmit})=> (
                <Form className='ui form' onSubmit={handleSubmit} autoComplete='off'>
                    <MyTextInput name='email' placeholder='Email' />
                    <MyTextInput name='password' placeholder='Password' type='password' />
                    <Button positive content='Login' type='submit' fluid />
                </Form>
            )}
        </Formik>
    );
}
```

Se añade la ruta del formulario en `App`.

Se cambia el `Link` de `/activities` a `/login` en `HomePage`.

![](/home/joan/e-learning/udemy/reactivities/doc/images/144.1.png)

##### 145 Crear las interfaces y métodos

Las interfaces se crean en `/models/user.ts` y los métodos en `/api/agent.ts`.

```tsx
const Account = {
    current: () => requests.get<User>('/account'),
    login: (user: UserFormValues) => requests.post<User>('/account/login', user),
    register: (user: UserFormValues) => requests.post<User>('/account/register', user)
}

const agent = {
    Activities,
    Account
}
```

##### 146 Crear un almacén de usuario

```tsx
import { makeAutoObservable } from "mobx";
import agent from "../api/agent";
import { User, UserFormValues } from "../models/user";

export default class UserStore {
    user: User | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get isLoggedIn() {
        return !!this.user;
    }

    login = async (creds: UserFormValues) => {
        try {
            const user = await agent.Account.login(creds);
            console.log(user);
        } catch (error) {
            throw error;
        }
    }
}
```

Se añade a la lista de almacenes en `/stores/store.ts`.

```tsx
import { createContext, useContext } from "react";
import ActivityStore from "./activityStore";
import CommonStore from "./commonStore";
import UserStore from "./userStore";

interface Store {
    activityStore: ActivityStore;
    commonStore: CommonStore;
    userStore: UserStore;
}

export const store: Store = {
    activityStore: new ActivityStore(),
    commonStore: new CommonStore(),
    userStore: new UserStore()
}

export const StoreContext = createContext(store);

// se crea un react hook para acceder al contexto de los almacenes
// (de momento uno)
export function useStore() {
    return useContext(StoreContext);
}
```

Se adapta `LoginForm` para usar el nuevo almacén.

```tsx
import { Form, Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Button } from 'semantic-ui-react';
import MyTextInput from '../../app/common/form/MyTextInput';
import { useStore } from '../../app/stores/store';

export default observer(function LoginForm() {
    const { userStore } = useStore();

    return (
        <Formik
            initialValues={{ email: '', password: '' }}
            onSubmit={values => userStore.login(values)}
        >
            {({ handleSubmit, isSubmitting }) => (
                <Form className='ui form' onSubmit={handleSubmit} autoComplete='off'>
                    <MyTextInput name='email' placeholder='Email' />
                    <MyTextInput name='password' placeholder='Password' type='password' />
                    <Button loading={isSubmitting} positive content='Login' type='submit' fluid />
                </Form>
            )}
        </Formik>
    );
})
```

![](/home/joan/e-learning/udemy/reactivities/doc/images/146.1.png)

##### 147 Mostrar errores en el formulario

```tsx
import { ErrorMessage, Form, Formik } from 'formik';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Button, Label } from 'semantic-ui-react';
import MyTextInput from '../../app/common/form/MyTextInput';
import { useStore } from '../../app/stores/store';

export default observer(function LoginForm() {
    const { userStore } = useStore();

    return (
        <Formik
            initialValues={{ email: '', password: '', error: null }}
            onSubmit={(values, { setErrors }) => userStore.login(values)
                .catch(error => setErrors({ error: 'Invalid email or password' }))}
        >
            {({ handleSubmit, isSubmitting, errors }) => (
                <Form className='ui form' onSubmit={handleSubmit} autoComplete='off'>
                    <MyTextInput name='email' placeholder='Email' />
                    <MyTextInput name='password' placeholder='Password' type='password' />
                    <ErrorMessage
                        name='error'
                        render={() =>
                            <Label style={{ marginBottom: 10 }} basic color='red' content={errors.error} />}
                    />
                    <Button loading={isSubmitting} positive content='Login' type='submit' fluid />
                </Form>
            )}
        </Formik>
    );
})
```

##### 148 Configuración del token al iniciar sesión

Se guarda la ficha en `CommonStore`. Se añade además una variable de estado `appLoaded` para controlar esta situación.

Los cambios más importantes se aplican a `userStore`.

```tsx
import { makeAutoObservable, runInAction } from "mobx";
import { history } from "../..";
import agent from "../api/agent";
import { User, UserFormValues } from "../models/user";
import { store } from "./store";

export default class UserStore {
    user: User | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get isLoggedIn() {
        return !!this.user;
    }

    login = async (creds: UserFormValues) => {
        try {
            const user = await agent.Account.login(creds);
            store.commonStore.setToken(user.token);
            runInAction(() => { this.user = user; })
            history.push('/activities');
        } catch (error) {
            throw error;
        }
    }

    logout = () => {
        store.commonStore.setToken(null);
        window.localStorage.removeItem('jwt');
        this.user = null;
        history.push('/');
    }
}
```

##### 149 Actualizar la página de inicio y la barra de navegación

En `HomePage` tenemos que saber si el usuario está identificado o no.

##### 150 Persistencia del inicio de sesión

Cuando el usuario refresca el navegador cuando está en la lista de actividades, se pierde la información de su sesión.

Se aprovecha el hecho de que la ficha permanece en el almacenamiento local.

Se usarán las reacciones MobX.

En lugar de asignar nulo a la ficha, se usará el almacenamiento local. Se define una reacción al cambiar el valor de `token`.

```tsx
import { makeAutoObservable, reaction } from "mobx";
import { ServerError } from "../models/serverError";

export default class CommonStore {
    error: ServerError | null = null;
    token: string | null = window.localStorage.getItem('jwt');
    appLoaded = false;

    constructor() {
        makeAutoObservable(this);

        reaction(
            () => this.token,
            token => {
                if (token) {
                    window.localStorage.setItem('jwt', token)
                } else {
                    window.localStorage.removeItem('jwt');
                }
            }
        )
    }

    setServerError = (error: ServerError) => {
        this.error = error;
    }

    setToken = (token: string | null) => {
        this.token = token;
    }

    setAppLoaded = () => {
        this.appLoaded = true;
    }
}
```

En el almacén de usuarios necesitamos un método que obtenga un usuario a partir de la ficha, que ya está definido en la API.

```tsx
getUser = async () => {
    try {
        const user = await agent.Account.current();
        runInAction(() => this.user = user);
    } catch (error) {
        console.log(error);
    }
}
```

En `App`, que es el primer componente que se carga en la aplicación se obtienen los almacenes común y de usuario para controlar el estado de la sesión mediante `useEffect`.

```tsx
import React, { useEffect } from 'react';
import { Container } from 'semantic-ui-react';
import NavBar from './NavBar';
import ActivityDashboard from '../../features/activities/dashboard/ActivityDashboard';
import { observer } from 'mobx-react-lite';
import { Route, Switch, useLocation } from 'react-router';
import HomePage from '../../features/home/HomePage';
import ActivityForm from '../../features/activities/form/ActivityForm';
import ActivityDetails from '../../features/activities/details/ActivityDetails';
import TestErrors from '../../features/errors/TestError';
import { ToastContainer } from 'react-toastify';
import NotFound from '../../features/errors/NotFound';
import ServerError from '../../features/errors/ServerError';
import LoginForm from '../../features/users/LoginForm';
import { useStore } from '../stores/store';
import LoadingComponent from './LoadingComponent';

function App() {
  const location = useLocation();
  const { commonStore, userStore } = useStore();

  useEffect(() => {
    if (commonStore.token) {
      userStore.getUser().finally(() => commonStore.setAppLoaded());
    } else {
      commonStore.setAppLoaded();
    }
  }, [commonStore, userStore])

  if (!commonStore.appLoaded) return <LoadingComponent content='Loading app...' />

  // </> equival a emprar <Fragment/>
  return (
    <>
      <ToastContainer position='bottom-right' hideProgressBar />
      <Route exact path='/' component={HomePage} />
      <Route
        path={'/(.+)'}
        render={() => (
          <>
            <NavBar />
            <Container style={{ marginTop: '7em' }}>
              <Switch>
                <Route exact path='/activities' component={ActivityDashboard} />
                <Route path='/activities/:id' component={ActivityDetails} />
                <Route key={location.key} path={['/createActivity', '/manage/:id']} component={ActivityForm} />
                <Route path='/errors' component={TestErrors} />
                <Route path='/server-error' component={ServerError} />
                <Route path='/login' component={LoginForm} />
                <Route component={NotFound} />
              </Switch>
            </Container>
          </>
        )}
      />
    </>
  );
}

export default observer(App);
```

Falla miserablemente porque en las peticiones no se pasa la ficha en la cabecera.

```
Value cannot be null. (Parameter 'email')
Stack trace
at Microsoft.AspNetCore.Identity.UserManager`1.FindByEmailAsync(String email) at API.Controllers.AccountController.GetCurrentUser() in /home/joan/e-learning/udemy/reactivities/API/Controllers/AccountController.cs:line 80 at lambda_method190(Closure , Object ) at Microsoft.AspNetCore.Mvc.Infrastructure.ActionMethodExecutor.AwaitableObjectResultExecutor.Execute(IActionResultTypeMapper mapper, ObjectMethodExecutor executor, Object controller, Object[] arguments) at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeActionMethodAsync>g__Awaited|12_0(ControllerActionInvoker invoker, ValueTask`1 actionResultValueTask) at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.<InvokeNextActionFilterAsync>g__Awaited|10_0(ControllerActionInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted) at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Rethrow(ActionExecutedContextSealed context) at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.Next(State& next, Scope& scope, Object& state, Boolean& isCompleted) at Microsoft.AspNetCore.Mvc.Infrastructure.ControllerActionInvoker.InvokeInnerFilterAsync() --- End of stack trace from previous location --- at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeFilterPipelineAsync>g__Awaited|19_0(ResourceInvoker invoker, Task lastTask, State next, Scope scope, Object state, Boolean isCompleted) at Microsoft.AspNetCore.Mvc.Infrastructure.ResourceInvoker.<InvokeAsync>g__Logged|17_1(ResourceInvoker invoker) at Microsoft.AspNetCore.Routing.EndpointMiddleware.<Invoke>g__AwaitRequestTask|6_0(Endpoint endpoint, Task requestTask, ILogger logger) at Microsoft.AspNetCore.Authorization.AuthorizationMiddleware.Invoke(HttpContext context) at Microsoft.AspNetCore.Authentication.AuthenticationMiddleware.Invoke(HttpContext context) at Swashbuckle.AspNetCore.SwaggerUI.SwaggerUIMiddleware.Invoke(HttpContext httpContext) at Swashbuckle.AspNetCore.Swagger.SwaggerMiddleware.Invoke(HttpContext httpContext, ISwaggerProvider swaggerProvider) at API.Middleware.ExceptionMiddleware.InvokeAsync(HttpContext context) in /home/joan/e-learning/udemy/reactivities/API/Middleware/ExceptionMiddleware.cs:line 29
```

##### 151 Enviar la ficha con la petición

Se usan los interceptores de Axios.

```tsx
axios.interceptors.request.use(config => {
    const token = store.commonStore.token;
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config;
})
```

##### 152 Añadir modales

Se crea un almacén específico para controlar la apertura y el cierre de los formularios modales.

Se crea un contenedor de modales basado en el almacén.

Se usa el contenedor de modales en `App`.

Se sustituye el `Link` de la `HomePage` por un `onClick`.

Se cierra el modal después de haber iniciado sesión, en `userStore.ts`.

##### 153 Añadir el formulario de registro

Se crea un nuevo método `register` en el almacén de usuarios, similar al `login`.

Se crea un `RegisterForm` a partir de `LoginForm`, ampliándolo con validaciones.

##### 154 Manipular errores de validación en el formulario de registro

Se va a usar `ValidationErrors`.

Es necesario adaptar la API para evitar el tipo de error que llega como una simple cadena en una `BadRequest`.

```c#
public async Task<ActionResult<UserDto>> Register(RegisterDto registerDto)
{
    if (await _userManager.Users.AnyAsync(u => u.Email == registerDto.Email))
    {
        return BadRequest("Email taken");
    }

    if (await _userManager.Users.AnyAsync(u => u.UserName == registerDto.Username))
    {
        return BadRequest("Username taken");
    }
```

```c#
ModelState.AddModelError("email", "Email taken");
return ValidationProblem(ModelState);
```

De esta forma conseguimos un método estándar de gestionar los errores en la API.

```json
{
    "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
    "title": "One or more validation errors occurred.",
    "status": 400,
    "traceId": "00-1741f2b85eeaf444ac806dbf2d68ca68-abd2e7b14789124c-00",
    "errors": {
        "email": [
            "Email taken"
        ]
    }
}
```

##### 155 Sumario de la sección 13

#### Sección 14: Relaciones en `Entity Framework`

##### 156 Introducción

* Relaciones en EF.
* Cargar entidades relacionadas. Por defecto EF no lo hace.
* Extensiones consultables `AutoMapper`.
* Incluir un proyecto de infraestructura.

![156.1](/home/joan/e-learning/udemy/reactivities/doc/images/156.1.png)
Entidad asociativa.

<img src="/home/joan/e-learning/udemy/reactivities/doc/images/156.2.png" alt="156.2" style="zoom:67%;" />
Proyecto de infraestructura.

##### 157 Configurar la nueva relación

Se establece la relación `m:n` entre actividades y usuarios.

```c#
using System;
using System.Collections.Generic;

namespace Domain
{
    public class Activity
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public string City { get; set; }
        public string Venue { get; set; }
        public ICollection<AppUser> Attendees { get; set; }
    }
}
```

```c#
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace Domain
{
    public class AppUser : IdentityUser
    {
        public string  DisplayName { get; set; }
        public string Bio { get; set; }
        public ICollection<Activity> Activities { get; set; }
    }
}
```

```bash
[joan@alkaid reactivities]$ dotnet ef migrations add ActivityAttendee -p Persistence -s API
```

```c#
using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Persistence.Migrations
{
    public partial class ActivityAttendee : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ActivityAppUser",
                columns: table => new
                {
                    ActivitiesId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AttendeesId = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityAppUser", x => new { x.ActivitiesId, x.AttendeesId });
                    table.ForeignKey(
                        name: "FK_ActivityAppUser_Activities_ActivitiesId",
                        column: x => x.ActivitiesId,
                        principalTable: "Activities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActivityAppUser_AspNetUsers_AttendeesId",
                        column: x => x.AttendeesId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityAppUser_AttendeesId",
                table: "ActivityAppUser",
                column: "AttendeesId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityAppUser");
        }
    }
}

```

Esta migración finalmente no interesa, porque es necesario añadir más columnas de las que simplemente ha considerado EF.

```bash
[joan@alkaid reactivities]$ dotnet ef migrations remove -p Persistence -s API
```

Se crea una nueva clase en `Domain`.

```c#
using System;

namespace Domain
{
    public class ActivityAttendee
    {
        public string AppUserId { get; set; }
        public AppUser AppUser { get; set; }
        public Guid ActivityId { get; set; }
        public Activity Activity { get; set; }
        public bool isHost { get; set; } // este asistente particular es el anfitrión de la actividad
    }
}
```

Se modifican las colecciones en ambas clases, `Activity` y `AppUser` para que hagan referencia a la nueva `ActivityAttendee`.

Hay que ajustar `DataContext`.

```c#
using Domain;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Persistence
{
    public class DataContext : IdentityDbContext<AppUser>
    {
        public DataContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<Activity> Activities { get; set; }
        public DbSet<ActivityAttendee> ActivityAttendees { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // se define la clave primaria de ActivityAttendee
            builder.Entity<ActivityAttendee>(x => x.HasKey(aa => new {aa.AppUserId, aa.ActivityId}));

            // dependencia con AppUser y clave extranjera
            builder.Entity<ActivityAttendee>()
                .HasOne(u => u.AppUser)
                .WithMany(a => a.Activities)
                .HasForeignKey(aa => aa.AppUserId);

            // dependencia con Activity y clave extranjera
            builder.Entity<ActivityAttendee>()
                .HasOne(u => u.Activity)
                .WithMany(a => a.Attendees)
                .HasForeignKey(aa => aa.ActivityId);
        }
    }
}
```

```bash
[joan@alkaid reactivities]$ dotnet tool update --global dotnet-ef
[joan@alkaid reactivities]$ dotnet ef migrations add ActivityAttendee -p Persistence -s API
Build started...
Build succeeded.
info: Microsoft.EntityFrameworkCore.Infrastructure[10403]
      Entity Framework Core 5.0.4 initialized 'DataContext' using provider 'Microsoft.EntityFrameworkCore.Sqlite' with options: None
Done. To undo this action, use 'ef migrations remove'
```

```c#
using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Persistence.Migrations
{
    public partial class ActivityAttendee : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ActivityAttendees",
                columns: table => new
                {
                    AppUserId = table.Column<string>(type: "TEXT", nullable: false),
                    ActivityId = table.Column<Guid>(type: "TEXT", nullable: false),
                    isHost = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ActivityAttendees", x => new { x.AppUserId, x.ActivityId });
                    table.ForeignKey(
                        name: "FK_ActivityAttendees_Activities_ActivityId",
                        column: x => x.ActivityId,
                        principalTable: "Activities",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ActivityAttendees_AspNetUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ActivityAttendees_ActivityId",
                table: "ActivityAttendees",
                column: "ActivityId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ActivityAttendees");
        }
    }
}
```

##### 158 Añadir un proyecto de infraestructura

Al crear una actividad hay que identificar el usuario que realiza esta acción para incluirlo en la lista de asistentes.

Desde la capa de negocio `Application` no tenemos acceso a `HttpContext` para determinar qué usuario está realizando la petición.

Se podría hacer que desde `API` se pasara el usuario a `Application`, pero esta sería una solución deficiente puesto que genera un acoplamiento excesivo entre las 2 capas.

Es más adecuado disponer de una capa de infraestructura.

```bash
[joan@alkaid reactivities]$ dotnet new classlib -n Infrastructure
The template "Class library" was created successfully.

Processing post-creation actions...
Running 'dotnet restore' on Infrastructure/Infrastructure.csproj...
  Determining projects to restore...
  Restored /home/joan/e-learning/udemy/reactivities/Infrastructure/Infrastructure.csproj (in 99 ms).
Restore succeeded.
[joan@alkaid reactivities]$ dotnet sln add Infrastructure
Project `Infrastructure/Infrastructure.csproj` added to the solution.
[joan@alkaid reactivities]$ cd Infrastructure/
[joan@alkaid Infrastructure]$ dotnet add reference ../Application/
Reference `..\Application\Application.csproj` added to the project.
[joan@alkaid Application]$ cd ..
[joan@alkaid reactivities]$ cd API/
[joan@alkaid API]$ dotnet add reference ../Infrastructure/
Reference `..\Infrastructure\Infrastructure.csproj` added to the project.
[joan@alkaid API]$ cd ..
[joan@alkaid reactivities]$ dotnet restore
  Determining projects to restore...
  Restored /home/joan/e-learning/udemy/reactivities/Infrastructure/Infrastructure.csproj (in 407 ms).
  Restored /home/joan/e-learning/udemy/reactivities/API/API.csproj (in 407 ms).
  3 of 5 projects are up-to-date for restore.
```

Se crea la carpeta `Application/Interfaces`.

Se crea una nueva interfaz.

```c#
namespace Application.Interfaces
{
    public interface IUserAccessor
    {
        string GetUserName();
    }
}
```

Se crea una nueva clase `UserAccessor` en `Infrastructure/Security`.

```c#
using System.Security.Claims;
using Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Security
{
    public class UserAccessor : IUserAccessor
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        public UserAccessor(IHttpContextAccessor httpContextAccessor)
        {
            this._httpContextAccessor = httpContextAccessor;
        }

        public string GetUserName()
        {
            return _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.Name);
        }
    }
}
```

Para finalizar se añade el acceso al usuario como un servicio.

```c#
using Application.Activities;
using Application.Interfaces;
using Infrastructure.Security;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.OpenApi.Models;
using Persistence;

namespace API.Extensions
{
    public static class ApplicationServicesExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services,
            IConfiguration config)
        {
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "API", Version = "v1" });
            });
            services.AddDbContext<DataContext>(opt =>
            {
                opt.UseSqlite(config.GetConnectionString("DefaultConnection"));
            });
            services.AddCors(opt =>
            {
                opt.AddPolicy("CorsPolicy", policy =>
                {
                    policy.AllowAnyMethod().AllowAnyHeader().WithOrigins("http://localhost:3000");
                });
            });
            services.AddMediatR(typeof(List.Handler).Assembly);
            services.AddAutoMapper(typeof(Application.Core.MappingProfiles).Assembly);
            services.AddScoped<IUserAccessor, UserAccessor>(); // tenemos acceso al usuario desde cualquier punto de la aplicación

            return services;
        }
    }
}
```

##### 159 Actualizar el manipulador para crear una actividad

```c#
using System.Threading;
using System.Threading.Tasks;
using Application.Core;
using Application.Interfaces;
using Domain;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Activities
{
    public class Create
    {
        public class Command : IRequest<Result<Unit>>
        {
            public Activity Activity { get; set; }
        }

        public class CommandValidator : AbstractValidator<Command>
        {
            public CommandValidator()
            {
                RuleFor(x => x.Activity).SetValidator(new ActivityValidator());
            }
        }

        public class Handler : IRequestHandler<Command, Result<Unit>>
        {
            private readonly DataContext _context;
            private readonly IUserAccessor _userAccessor;
            public Handler(DataContext context, IUserAccessor userAccessor)
            {
                _userAccessor = userAccessor;
                _context = context;
            }

            public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
            {
                var user = await _context.Users.FirstOrDefaultAsync(x => x.UserName == _userAccessor.GetUserName());

                var attendee = new ActivityAttendee
                {
                    AppUser = user,
                    Activity = request.Activity,
                    isHost = true
                };

                request.Activity.Attendees.Add(attendee);

                _context.Activities.Add(request.Activity);

                var result = await _context.SaveChangesAsync() > 0;

                if (!result) return Result<Unit>.Failure("Failed to create activity");

                return Result<Unit>.Success(Unit.Value);
            }
        }
    }
}
```

##### 160 Probar la creación de una actividad

Revisar el módulo 14 de la colección postman.

El hecho de que la lista de asistentes de una actividad no esté inicializado genera problemas al crear una actividad, al ser nula.

```json
{
    "id": "4145a6c6-43fc-4fbc-9309-25be79c79be0",
    "title": "Past Activity 11",
    "date": "2021-01-17T13:41:57.043",
    "description": "Activity 2 months ago",
    "category": "drinks",
    "city": "London",
    "venue": "Pub",
    "attendees": null
},
```

Cuando se soluciona el problema devuelve la lista de asistentes vacía, en la que debería aparecer Bob como anfitrión.

```json
{
    "id": "f62bd222-f672-44c7-906f-c4a2119cd4ea",
    "title": "Test event with bob as host",
    "date": "2021-04-07T16:48:36.574",
    "description": "Description of the test event",
    "category": "drinks",
    "city": "London",
    "venue": "London venue",
    "attendees": []
}
```

EF no la hace automáticamente, hay que indicarlo explícitamente, aunque exista en la base de datos el registro correspondiente.

```json
[{
	"stmt": "SELECT * FROM ActivityAttendees;",
	"header": ["AppUserId", "ActivityId", "isHost"],
	"rows": [
		["fa2273dc-b638-464e-9d34-b0dc111dd09c", "F62BD222-F672-44C7-906F-C4A2119CD4EA", "1"]
	]
}]
```

##### 161 Cargar datos relacionados

https://docs.microsoft.com/en-us/ef/ef6/querying/related-data

Se comentan los 3 métodos de hacerlo. Inicialmente se utilizará `Eagerly Loading`, cargando con ansiedad.

En el manipulador de la lista de actividades

```c#
public async Task<Result<List<Activity>>> Handle(Query request, CancellationToken cancellationToken)
{
    var activities = await _context.Activities
        .Include(a => a.Attendees)
        .ThenInclude(u => u.AppUser)
        .ToListAsync();

    return Result<List<Activity>>.Success(activities);
}
```

Provoca un error de este tipo:

```json
A possible object cycle was detected. This can either be due to a cycle or if the object depth is larger than the maximum allowed depth of 32. Consider using ReferenceHandler.Preserve on JsonSerializerOptions to support cycles.
```

Una actividad tiene asistentes (usuario) que a su vez asisten a una lista de actividades...

##### 162 Dar forma a los datos relacionados

Se crea un `ActivityDto` y se usa **`AutoMapper`** para mover información de una `Activity` a una `ActivityDto`, aunque no termina de funcionar.

```json
{
    "id": "f62bd222-f672-44c7-906f-c4a2119cd4ea",
    "title": "Test event with bob as host",
    "date": "2021-04-07T16:48:36.574",
    "description": "Description of the test event",
    "category": "drinks",
    "city": "London",
    "venue": "London venue",
    "hostUsername": null,
    "profiles": null
}
```

faltan `hostUsername` y `profiles`.

##### 163 Configurar los perfiles de `AutoMapper`

Se cambia `Profiles` por `Attenddees` en `ActivityDto`.

En `MappingProfiles` se define la correspondencia para `HostUsername`.

```c#
using System.Linq;
using Application.Activities;
using AutoMapper;
using Domain;

namespace Application.Core
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            CreateMap<Activity, Activity>();
            CreateMap<Activity, ActivityDto>()
                .ForMember(d => d.HostUsername, opt => opt.MapFrom(s => s.Attendees
                    .FirstOrDefault(x => x.isHost).AppUser.UserName));
        }
    }
}
```

Al lanzar la prueba se produce un error 500, `Error mapping types` de `AutoMapper`.

```bash
Mapping types:
      Activity -> ActivityDto
      Domain.Activity -> Application.Activities.ActivityDto
      
      Type Map configuration:
      Activity -> ActivityDto
      Domain.Activity -> Application.Activities.ActivityDto
      
      Destination Member:
      Attendees
            
       ---> AutoMapper.AutoMapperMappingException: Missing type map configuration or unsupported mapping.
      
      Mapping types:
      ActivityAttendee -> Profile
```

```c#
using System.Linq;
using Application.Activities;
using AutoMapper;
using Domain;

namespace Application.Core
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            CreateMap<Activity, Activity>();
            CreateMap<Activity, ActivityDto>()
                .ForMember(d => d.HostUsername, opt => opt.MapFrom(s => s.Attendees
                    .FirstOrDefault(x => x.isHost).AppUser.UserName));
            CreateMap<ActivityAttendee, Profiles.Profile>()
                .ForMember(d => d.DisplayName, opt => opt.MapFrom(s => s.AppUser.DisplayName))
                .ForMember(d => d.Username, opt => opt.MapFrom(s => s.AppUser.UserName))
                .ForMember(d => d.Bio, opt => opt.MapFrom(s => s.AppUser.Bio));
                // se ignora Image de momento
        }
    }
}
```

Ahora sí:

```json
{
    "id": "f62bd222-f672-44c7-906f-c4a2119cd4ea",
    "title": "Test event with bob as host",
    "date": "2021-04-07T16:48:36.574",
    "description": "Description of the test event",
    "category": "drinks",
    "city": "London",
    "venue": "London venue",
    "hostUsername": "bob",
    "attendees": [
        {
            "username": "bob",
            "displayName": "Bob",
            "bio": null,
            "image": null
        }
    ]
}
```

En el terminal vemos que la consulta lanzada no es muy óptima.

```sql
SELECT a.Id, a.Category, a.City, a.Date, a.Description, a.Title, a.Venue, t.AppUserId, t.ActivityId, t.isHost, t.Id, t.AccessFailedCount, t.Bio, t.ConcurrencyStamp, t.DisplayName, t.Email, t.EmailConfirmed, t.LockoutEnabled, t.LockoutEnd, t.NormalizedEmail, t.NormalizedUserName, t.PasswordHash, t.PhoneNumber, t.PhoneNumberConfirmed, t.SecurityStamp, t.TwoFactorEnabled, t.UserName
      FROM Activities AS a
      LEFT JOIN (
          SELECT a0.AppUserId, a0.ActivityId, a0.isHost, a1.Id, a1.AccessFailedCount, a1.Bio, a1.ConcurrencyStamp, a1.DisplayName, a1.Email, a1.EmailConfirmed, a1.LockoutEnabled, a1.LockoutEnd, a1.NormalizedEmail, a1.NormalizedUserName, a1.PasswordHash, a1.PhoneNumber, a1.PhoneNumberConfirmed, a1.SecurityStamp, a1.TwoFactorEnabled, a1.UserName
          FROM ActivityAttendees AS a0
          INNER JOIN AspNetUsers AS a1 ON a0.AppUserId = a1.Id
      ) AS t ON a.Id = t.ActivityId
      ORDER BY a.Id, t.AppUserId, t.ActivityId, t.Id
```

Se están solicitando atributos que no son necesarios. Se plantea la posibilidad de cambiar el método `Eagerly Loading` por `Projection`.

Pasamos de:

```c#
public async Task<Result<List<ActivityDto>>> Handle(Query request, CancellationToken cancellationToken)
{
    var activities = await _context.Activities
        .Include(a => a.Attendees)
        .ThenInclude(u => u.AppUser)
        .ToListAsync();

    var activitiesToReturn = _mapper.Map<List<ActivityDto>>(activities);

    return Result<List<ActivityDto>>.Success(activitiesToReturn);
}
```

a usar:

```c#
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Application.Core;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Activities
{
    public class List
    {
        public class Query : IRequest<Result<List<ActivityDto>>> { }

        public class Handler : IRequestHandler<Query, Result<List<ActivityDto>>>
        {
            private readonly DataContext _context;
            private readonly IMapper _mapper;
            public Handler(DataContext context, IMapper mapper)
            {
                _mapper = mapper;
                _context = context;
            }

            public async Task<Result<List<ActivityDto>>> Handle(Query request, CancellationToken cancellationToken)
            {
                var activities = await _context.Activities
                    .ProjectTo<ActivityDto>(_mapper.ConfigurationProvider)
                    .ToListAsync();

                return Result<List<ActivityDto>>.Success(activities);
            }
        }
    }
}
```

que produce:

```sql
SELECT a1.Category, a1.City, a1.Date, a1.Description, (
          SELECT a0.UserName
          FROM ActivityAttendees AS a
          INNER JOIN AspNetUsers AS a0 ON a.AppUserId = a0.Id
          WHERE (a1.Id = a.ActivityId) AND a.isHost
          LIMIT 1), a1.Id, a1.Title, a1.Venue, t.Bio, t.DisplayName, t.Username, t.AppUserId, t.ActivityId, t.Id
      FROM Activities AS a1
      LEFT JOIN (
          SELECT a3.Bio, a3.DisplayName, a3.UserName AS Username, a2.AppUserId, a2.ActivityId, a3.Id
          FROM ActivityAttendees AS a2
          INNER JOIN AspNetUsers AS a3 ON a2.AppUserId = a3.Id
      ) AS t ON a1.Id = t.ActivityId
      ORDER BY a1.Id, t.AppUserId, t.ActivityId, t.Id
```

Se procede a hacer lo mismo con el manipulador de `Details` para obtener un `ActivityDto`.

```c#
public async Task<Result<ActivityDto>> Handle(Query request, CancellationToken cancellationToken)
{
    var activity = await _context.Activities
        .ProjectTo<ActivityDto>(_mapper.ConfigurationProvider)
        .FirstOrDefaultAsync(x => x.Id == request.Id); // Projection no admite FindAsync

    return Result<ActivityDto>.Success(activity);
}
```

##### 164 Añadir el manipulador de asistente

Es necesario determinar si una actividad se ha cancelado. Se añade la propiedad correspondiente en `Activity` y `ActivityDto`.

Esto hace necesaria una nueva migración. Se para la aplicación.

```bash
[joan@alkaid reactivities]$ dotnet ef migrations add AddCancelledProperty -p Persistence -s API
Build started...
Build succeeded.
info: Microsoft.EntityFrameworkCore.Infrastructure[10403]
      Entity Framework Core 5.0.4 initialized 'DataContext' using provider 'Microsoft.EntityFrameworkCore.Sqlite' with options: None
Done. To undo this action, use 'ef migrations remove'
```

```c#
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Core;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Activities
{
    public class UpdateAttendance
    {
        public class Command : IRequest<Result<Unit>>
        {
            public Guid Id { get; set; }
        }

        public class Handler : IRequestHandler<Command, Result<Unit>>
        {
            private readonly DataContext _context;
            private readonly IUserAccessor _userAccessor;
            public Handler(DataContext context, IUserAccessor userAccessor)
            {
                _userAccessor = userAccessor;
                _context = context;
            }

            public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
            {
                var activity = await _context.Activities
                    .Include(a => a.Attendees).ThenInclude(u => u.AppUser)
                    .SingleOrDefaultAsync(x => x.Id == request.Id);

                if (activity == null) return null;

                var user = await _context.Users
                    .FirstOrDefaultAsync(x => x.UserName == _userAccessor.GetUserName());
                
                if (user == null) return null;

                var hostUsername = activity.Attendees.FirstOrDefault(x => x.isHost)?.AppUser?.UserName; // de momento hay actividades que no tienen anfitrión

                var attendance = activity.Attendees.FirstOrDefault(x => x.AppUser.UserName == user.UserName);

                if (attendance != null && hostUsername == user.UserName)
                    activity.IsCancelled = !activity.IsCancelled;

                if (attendance != null && hostUsername != user.UserName)
                    activity.Attendees.Remove(attendance);

                if (attendance == null)
                {
                    attendance = new ActivityAttendee
                    {
                        AppUser = user,
                        Activity = activity,
                        isHost = false
                    };

                    activity.Attendees.Add(attendance);
                }

                var result = await _context.SaveChangesAsync() > 0;

                return result ? Result<Unit>.Success(Unit.Value) : Result<Unit>.Failure("Problem updating attendance");
            }
        }
    }
}
```

Se añade un punto final al controlador de actividades para dar acceso a esta funcionalidad.

```c#
[HttpPost("{id}/attend")]
public async Task<IActionResult> Attend(Guid id)
{
    return HandleResult(await Mediator.Send(new UpdateAttendance.Command { Id = id }));
}
```

Pruebas en Postman

1. Login as Tom and save token to env
2. Update attendance as tom f62bd222-f672-44c7-906f-c4a2119cd4ea Bearer {{tom_token}}
3. Get Activity Details

```json
{
    "id": "f62bd222-f672-44c7-906f-c4a2119cd4ea",
    "title": "Test event with bob as host",
    "date": "2021-04-07T16:48:36.574",
    "description": "Description of the test event",
    "category": "drinks",
    "city": "London",
    "venue": "London venue",
    "hostUsername": "bob",
    "isCancelled": false,
    "attendees": [
        {
            "username": "tom",
            "displayName": "Tom",
            "bio": null,
            "image": null
        },
        {
            "username": "bob",
            "displayName": "Bob",
            "bio": null,
            "image": null
        }
    ]
}
```

4. Update attendance as tom (se elimina de la lista de asistentes)
5. Cancel activity by host (x2)

##### 165 Añadir una política `auth` personalizada

Con el objetivo de que *sólo el anfitrión de la actividad pueda editar una actividad*.

```c#
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Persistence;

namespace Infrastructure.Security
{
    public class IsHostRequirement : IAuthorizationRequirement
    {

    }

    public class IsHostRequirementHandler : AuthorizationHandler<IsHostRequirement>
    {
        private readonly DataContext _dataContext;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public IsHostRequirementHandler(DataContext dataContext, IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
            _dataContext = dataContext;
        }

        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, IsHostRequirement requirement)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null) return Task.CompletedTask; // no está autorizado

            var activityId = Guid.Parse(_httpContextAccessor.HttpContext?.Request.RouteValues
                .SingleOrDefault(x => x.Key == "id").Value?.ToString());

            var attendee = _dataContext.ActivityAttendees.FindAsync(userId, activityId).Result;

            if (attendee == null) return Task.CompletedTask; // no está autorizado

            if (attendee.isHost) context.Succeed(requirement);

            return Task.CompletedTask; // está autorizado
        }
    }
}
```

Se registra en las extensiones del servicio de identidad.

```c#
using System.Text;
using API.Services;
using Domain;
using Infrastructure.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Persistence;

namespace API.Extensions
{
    public static class IdentityServiceExtensions
    {
        public static IServiceCollection AddIdentityServices(this IServiceCollection services, IConfiguration config)
        {
            services.AddIdentityCore<AppUser>(opt =>
            {
                // Identity utiliza unas opciones por defecto que se pueden configurar. Por ejemplo:
                opt.Password.RequireNonAlphanumeric = false;
            })
            .AddEntityFrameworkStores<DataContext>()
            .AddSignInManager<SignInManager<AppUser>>();

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["TokenKey"]));

            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(opt =>
                {
                    opt.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        IssuerSigningKey = key,
                        ValidateIssuer = false,
                        ValidateAudience = false
                    };
                });
            // +++ IsHostPolicy
            services.AddAuthorization(opt => {
                opt.AddPolicy("IsActivityHost", policy => {
                    policy.Requirements.Add(new IsHostRequirement())
                });
            });
            services.AddTransient<IAuthorizationHandler, IsHostRequirementHandler>();
            // --- IsHostPolicy
            services.AddScoped<TokenService>();

            return services;
        }
    }
}
```

La política se aplica a los puntos finales del controlador.

```c#
[Authorize(Policy = "IsActivityHost")]
[HttpPut("{id}")]
public async Task<IActionResult> EditActivity(Guid id, Activity activity)
{
    activity.Id = id;
    return HandleResult(await Mediator.Send(new Edit.Command { Activity = activity }));
}

[Authorize(Policy = "IsActivityHost")]
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteActivity(Guid id)
{
    return HandleResult(await Mediator.Send(new Delete.Command { Id = id }));
}
```

La prueba `Edit an Activity as Bob who is host` provoca que limpia la lista de asistentes de la actividad y se queda sin anfitrión. Se ha introducido un bug.

##### 166 Resolviendo el bug con en manipulador de edición

Comentando la política en el punto final se puede comprobar que es el motivo de que editar una actividad no funcione correctamente.

```c#
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Infrastructure.Security
{
    public class IsHostRequirement : IAuthorizationRequirement
    {

    }

    public class IsHostRequirementHandler : AuthorizationHandler<IsHostRequirement>
    {
        private readonly DataContext _dataContext;
        private readonly IHttpContextAccessor _httpContextAccessor;
        public IsHostRequirementHandler(DataContext dataContext, IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
            _dataContext = dataContext;
        }

        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, IsHostRequirement requirement)
        {
            var userId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null) return Task.CompletedTask; // no está autorizado

            var activityId = Guid.Parse(_httpContextAccessor.HttpContext?.Request.RouteValues
                .SingleOrDefault(x => x.Key == "id").Value?.ToString());

            // se recupera en memoria y en la operación de edición no se actualiza
            var attendee = _dataContext.ActivityAttendees
                .AsNoTracking() // soluciona el problema, pero no funciona con el método FindAsync
                .SingleOrDefaultAsync(x => x.AppUserId == userId && x.ActivityId == activityId)
                .Result;

            if (attendee == null) return Task.CompletedTask; // no está autorizado

            if (attendee.isHost) context.Succeed(requirement);

            return Task.CompletedTask; // está autorizado
        }
    }
}
```

##### 167 Actualizar la semilla de datos

Para que todas las actividades tengan un anfitrión.

`StuddentAssents/snippets/SeedData with attendees.txt` sustituye la definición de `Seed`.

```bash
[joan@alkaid reactivities]$ dotnet ef database drop -p Persistence -s API
Build started...
Build succeeded.
info: Microsoft.EntityFrameworkCore.Infrastructure[10403]
      Entity Framework Core 5.0.4 initialized 'DataContext' using provider 'Microsoft.EntityFrameworkCore.Sqlite' with options: None
Are you sure you want to drop the database 'main' on server 'reactivities.db'? (y/N)
y
info: Microsoft.EntityFrameworkCore.Infrastructure[10403]
      Entity Framework Core 5.0.4 initialized 'DataContext' using provider 'Microsoft.EntityFrameworkCore.Sqlite' with options: None
Dropping database 'main' on server 'reactivities.db'.
Successfully dropped database 'main'.
```

##### 168 Sumario de la sección 14

#### Sección 15: Característica - asistencia en la parte de cliente

##### 169 Introducción

##### 170 Añadir el componente de asistentes

Para mostrar la lista de asistentes a una actividad.

Se monta un ejemplo del componente que se añade a `ActivityListItem`.

```tsx
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Image, List } from 'semantic-ui-react';

export default observer(function ActivityListItemAttendee() {
    return (
        <List horizontal>
            <List.Item>
                <Image size='mini' circular src='/assets/user.png' />
            </List.Item>
            <List.Item>
                <Image size='mini' circular src='/assets/user.png' />
            </List.Item>
            <List.Item>
                <Image size='mini' circular src='/assets/user.png' />
            </List.Item>
        </List>
    )
})
```

Se crea un modelo para el perfil de un asistente que se incluye al modelo de actividad, además de resto de atributos que definen la actividad. Los nuevos, de momento se declaran opcionales.

```tsx
import { Profile } from "./profile";

export interface Activity {
    id: string;
    title: string;
    date: Date | null;
    description: string;
    category: string;
    city: string;
    venue: string;
    hostUsername?: string;
    isCancelled?: boolean;
    attendees?: Profile[];
}
```

El componente finalmente queda de esta forma.

```tsx
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Link } from 'react-router-dom';
import { Image, List } from 'semantic-ui-react';
import { Profile } from '../../../app/models/profile';

interface Props {
    attendees: Profile[];
}

export default observer(function ActivityListItemAttendee({ attendees }: Props) {
    return (
        <List horizontal>
            {attendees.map(attendee => (
                <List.Item key={attendee.username} as={Link} to={`/profiles/${attendee.username}`}>
                    <Image size='mini' circular src={attendee.image || '/assets/user.png'} />
                </List.Item>
            ))}
        </List>
    )
})
```

##### 171 Actualizar el componente de detalles de una actividad

```tsx
import React from 'react'
import { Segment, List, Label, Item, Image } from 'semantic-ui-react'
import { Link } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { Profile } from '../../../app/models/profile'

interface Props {
    attendees: Profile[];
}

export default observer(function ActivityDetailedSidebar({ attendees }: Props) {
    return (
        <>
            <Segment
                textAlign='center'
                style={{ border: 'none' }}
                attached='top'
                secondary
                inverted
                color='teal'
            >
                {attendees.length} {attendees.length === 1 ? 'Person' : 'People'} going
            </Segment>
            <Segment attached>
                <List relaxed divided>
                    {attendees.map(attendee => (
                        <Item style={{ position: 'relative' }} key={attendee.username}>
                            <Label
                                style={{ position: 'absolute' }}
                                color='orange'
                                ribbon='right'
                            >
                                Host
                            </Label>
                            <Image size='tiny' src={attendee.image || '/assets/user.png'} />
                            <Item.Content verticalAlign='middle'>
                                <Item.Header as='h3'>
                                    <Link to={`/profiles/${attendee.username}`}>{attendee.displayName}</Link>
                                </Item.Header>
                                <Item.Extra style={{ color: 'orange' }}>Following</Item.Extra>
                            </Item.Content>
                        </Item>
                    ))}
                </List>
            </Segment>
        </>

    )
})
```

##### 172 Mostrar condicionalmente los botones

Se añaden atributos a la interfaz `Activitity` para controlar estados.

```tsx
import { Profile } from "./profile";

export interface Activity {
    id: string;
    title: string;
    date: Date | null;
    description: string;
    category: string;
    city: string;
    venue: string;
    hostUsername?: string;
    isCancelled?: boolean;
    isGoing?: boolean;
    isHost?: boolean;
    host?: Profile;
    attendees?: Profile[];
}
```

Hay que adaptar el método `setActivity(Activity)` del almacén de actividades.

```tsx
private setActivity = (activity: Activity) => {
    const user = store.userStore.user; // se obtiene el usuario
    if (user) {
        activity.isGoing = activity.attendees?.some(
            a => a.username === user.username
        )
        activity.isHost = activity.hostUsername === user.username;
        activity.host = activity.attendees?.find(x => x.username === activity.hostUsername);
    }
    activity.date = new Date(activity.date!);
    this.activityRegistry.set(activity.id, activity);
}
```

Se modifica `ActivityListItem`.

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon, Item, Label, Segment } from 'semantic-ui-react';
import { Activity } from '../../../app/models/activity';
import { format } from 'date-fns';
import ActivityListItemAttendee from './ActivityListItemAttendee';

interface Props {
    activity: Activity
}

export default function ActivityListItem({ activity }: Props) {
    return (
        <Segment.Group>
            <Segment>
                <Item.Group>
                    <Item>
                        <Item.Image size='tiny' circular src='/assets/user.png' />
                        <Item.Content>
                            <Item.Header as={Link} to={`/activities/${activity.id}`}>
                                {activity.title}
                            </Item.Header>
                            <Item.Description>Hosted by {activity.host?.displayName}</Item.Description>
                            {activity.isHost && (
                                <Item.Description>
                                    <Label basic color='orange'>
                                        You are hosting this activity
                                    </Label>
                                </Item.Description>
                            )}
                            {activity.isGoing && !activity.isHost && (
                                <Item.Description>
                                    <Label basic color='green'>
                                        You are going to this activity
                                    </Label>
                                </Item.Description>
                            )}
                        </Item.Content>
                    </Item>
                </Item.Group>
            </Segment>
            <Segment>
                <span>
                    <Icon name='clock' /> {format(activity.date!, 'dd MMM yyyy h:mm aa')}
                    <Icon name='marker' /> {activity.venue}
                </span>
            </Segment>
            <Segment>
                <ActivityListItemAttendee attendees={activity.attendees!} />
            </Segment>
            <Segment clearing>
                <span>{activity.description}</span>
                <Button
                    as={Link}
                    to={`/activities/${activity.id}`}
                    color='teal'
                    floated='right'
                    content='View'
                />
            </Segment>
        </Segment.Group>
    );
}
```

Se modifica `ActivityDetailHeader`.

Botones mostrados condicionalmente.

Antes.

```tsx
<Segment clearing attached='bottom'>
    <Button color='teal'>Join Activity</Button>
    <Button>Cancel attendance</Button>
    <Button as={Link} to={`/manage/${activity.id}`} color='orange' floated='right'>
        Manage Event
    </Button>
</Segment>
```

Después.

```tsx
<Segment clearing attached='bottom'>
    {activity.isHost ? (
        <Button as={Link} to={`/manage/${activity.id}`} color='orange' floated='right'>
            Manage Event
        </Button>
    ) : activity.isGoing ? (
        <Button>Cancel attendance</Button>
    ) : (
        <Button color='teal'>Join Activity</Button>
    )}
</Segment>
```

Se modifica `ActivityDetailSidebar`.

En lugar de pasar la lista de asistentes se le pasa la actividad, en la interfaz `Props`. Se condiciona mostrar la etiqueta `Host`.

##### 173 Añadir los métodos de almacén para asistir

Se comienza por `agent.ts`.

```tsx
const Activities = {
    list: () => requests.get<Activity[]>('/activities'),
    details: (id: string) => requests.get<Activity>(`/activities/${id}`),
    create: (activity: Activity) => requests.post<void>('/activities', activity),
    update: (activity: Activity) => requests.put<void>(`/activities/${activity.id}`, activity),
    delete: (id: string) => requests.del<void>(`/activities/${id}`),
    attend: (id: string) => requests.post<void>(`/activities/${id}/attend`, {})
}
```

Se continúa con el almacén de actividades. Para asignar un perfil a un nuevo asistente se define una clase x en `profile.ts`.

```tsx
updateAttendance = async () => {
    const user = store.userStore.user;
    this.loading = true;
    try {
        await agent.Activities.attend(this.selectedActivity!.id);
        runInAction(() => {
            if (this.selectedActivity?.isGoing) {
                this.selectedActivity.attendees =
                    this.selectedActivity.attendees?.filter(a => a.username !== user?.username);
                this.selectedActivity.isGoing = false;
            } else {
                const attendee = new Profile(user!);
                this.selectedActivity?.attendees?.push(attendee);
                this.selectedActivity!.isGoing = true;
            }
            this.activityRegistry.set(this.selectedActivity!.id, this.selectedActivity!);
        })
    } catch (error) {
        console.log(error);
    } finally {
        runInAction(() => { this.loading = false; })
    }
}
```

Se modifica `ActivityDetailHeader` para utilizar esta funcionalidad.

```tsx
import { observer } from 'mobx-react-lite';
import React from 'react'
import { Link } from 'react-router-dom';
import { Button, Header, Item, Segment, Image } from 'semantic-ui-react'
import { Activity } from "../../../app/models/activity";
import { format } from 'date-fns'
import { useStore } from '../../../app/stores/store';

const activityImageStyle = {
    filter: 'brightness(30%)'
};

const activityImageTextStyle = {
    position: 'absolute',
    bottom: '5%',
    left: '5%',
    width: '100%',
    height: 'auto',
    color: 'white'
};

interface Props {
    activity: Activity
}

export default observer(function ActivityDetailedHeader({ activity }: Props) {
    const {activityStore: {updateAttendance, loading}} = useStore();

    return (
        <Segment.Group>
            <Segment basic attached='top' style={{ padding: '0' }}>
                <Image src={`/assets/categoryImages/${activity.category}.jpg`} fluid style={activityImageStyle} />
                <Segment style={activityImageTextStyle} basic>
                    <Item.Group>
                        <Item>
                            <Item.Content>
                                <Header
                                    size='huge'
                                    content={activity.title}
                                    style={{ color: 'white' }}
                                />
                                <p>{format(activity.date!, 'dd MMM yyyy')}</p>
                                <p>
                                    Hosted by <strong><Link to={`/profiles/${activity.host?.username}`}>{activity.host?.displayName}</Link></strong>
                                </p>
                            </Item.Content>
                        </Item>
                    </Item.Group>
                </Segment>
            </Segment>
            <Segment clearing attached='bottom'>
                {activity.isHost ? (
                    <Button as={Link} to={`/manage/${activity.id}`} color='orange' floated='right'>
                        Manage Event
                    </Button>
                ) : activity.isGoing ? (
                    <Button loading={loading} onClick={updateAttendance}>Cancel attendance</Button>
                ) : (
                    <Button loading={loading} onClick={updateAttendance} color='teal'>Join Activity</Button>
                )}
            </Segment>
        </Segment.Group>
    )
})
```

##### 174 Actualizar los métodos para crear y editar

Se hacen obligatorios todos los atributos de `Activity` excepto `host`. Se crea la clase `ActivityFormValues` con los valores iniciales de una actividad.

Se actualiza `ActivityForm`.

Se actualiza el almacén de actividades.

Antes.

```tsx
createActivity = async (activity: Activity) => {
    this.loading = true;
    try {
        await agent.Activities.create(activity);
        runInAction(() => {
            //this.activities.push(activity);
            this.activityRegistry.set(activity.id, activity);
            this.selectedActivity = activity;
            this.editMode = false;
            this.loading = false;
        })
    } catch (error) {
        console.log(error);
        runInAction(() => {
            this.loading = false;
        })
    }
}
```

Supone a la vez adaptar los métodos en `agent.ts`. Crear una clase `Activity`.

Después.

```tsx
createActivity = async (activity: ActivityFormValues) => {
    const user = store.userStore.user;
    const attendee = new Profile(user!);
    try {
        await agent.Activities.create(activity);
        const newActivity = new Activity(activity);
        newActivity.hostUsername = user!.username;
        newActivity.attendees = [attendee];
        this.setActivity(newActivity);
        runInAction(() => {
            this.selectedActivity = newActivity;
        })
    } catch (error) {
        console.log(error);
    }
}
```

Lo mismo para `updateActivity`.

```tsx
updateActivity = async (activity: ActivityFormValues) => {
    try {
        await agent.Activities.update(activity);
        runInAction(() => {
            if (activity.id) {
                let updatedActivity = {...this.getActivity(activity.id), ...activity}
                this.activityRegistry.set(activity.id, updatedActivity as Activity);
                this.selectedActivity = updatedActivity as Activity;
            }                
        })
    } catch (error) {
        console.log(error);
    }
}
```

##### 175 Añadir un método para cancelar una actividad

Se modifica el almacén de actividades.

```tsx
cancelActivityToggle = async () => {
    this.loading = true;
    try {
        await agent.Activities.attend(this.selectedActivity!.id);
        runInAction(() => {
            this.selectedActivity!.isCancelled = !this.selectedActivity?.isCancelled;
            this.activityRegistry.set(this.selectedActivity!.id, this.selectedActivity!);
        })
    } catch (error) {
        console.log(error);
    } finally {
        runInAction(() => { this.loading = false });
    }
}
```

Se modifica `ActivityDetailedHeader`.

```tsx
import { observer } from 'mobx-react-lite';
import React from 'react'
import { Link } from 'react-router-dom';
import { Button, Header, Item, Segment, Image, Label } from 'semantic-ui-react'
import { Activity } from "../../../app/models/activity";
import { format } from 'date-fns'
import { useStore } from '../../../app/stores/store';

const activityImageStyle = {
    filter: 'brightness(30%)'
};

const activityImageTextStyle = {
    position: 'absolute',
    bottom: '5%',
    left: '5%',
    width: '100%',
    height: 'auto',
    color: 'white'
};

interface Props {
    activity: Activity
}

export default observer(function ActivityDetailedHeader({ activity }: Props) {
    const { activityStore: { updateAttendance, loading, cancelActivityToggle } } = useStore();

    return (
        <Segment.Group>
            <Segment basic attached='top' style={{ padding: '0' }}>
                {activity.isCancelled &&
                    <Label style={{ position: 'absolute', zIndex: 1000, left: -14, top: 20 }}
                        ribbon color='red' content='Cancelled' />
                }
                <Image src={`/assets/categoryImages/${activity.category}.jpg`} fluid style={activityImageStyle} />
                <Segment style={activityImageTextStyle} basic>
                    <Item.Group>
                        <Item>
                            <Item.Content>
                                <Header
                                    size='huge'
                                    content={activity.title}
                                    style={{ color: 'white' }}
                                />
                                <p>{format(activity.date!, 'dd MMM yyyy')}</p>
                                <p>
                                    Hosted by <strong><Link to={`/profiles/${activity.host?.username}`}>{activity.host?.displayName}</Link></strong>
                                </p>
                            </Item.Content>
                        </Item>
                    </Item.Group>
                </Segment>
            </Segment>
            <Segment clearing attached='bottom'>
                {activity.isHost ? (
                    <>
                        <Button
                            color={activity.isCancelled ? 'green' : 'red'}
                            floated='left'
                            basic
                            content={activity.isCancelled ? 'Re-activate Activity' : 'Cancel Activity'}
                            onClick={cancelActivityToggle}
                            loading={loading}
                        />
                        <Button as={Link}
                            disabled={activity.isCancelled}
                            to={`/manage/${activity.id}`}
                            color='orange'
                            floated='right'>
                                Manage Event
                        </Button>
                    </>
                ) : activity.isGoing ? (
                    <Button loading={loading} onClick={updateAttendance}>Cancel attendance</Button>
                ) : (
                    <Button disabled={activity.isCancelled}
                        loading={loading}
                        onClick={updateAttendance}
                        color='teal'>
                            Join Activity
                    </Button>
                )}
            </Segment>
        </Segment.Group>
    )
})
```

Se modifica `ActivityListItem`.

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Icon, Item, Label, Segment } from 'semantic-ui-react';
import { Activity } from '../../../app/models/activity';
import { format } from 'date-fns';
import ActivityListItemAttendee from './ActivityListItemAttendee';

interface Props {
    activity: Activity
}

export default function ActivityListItem({ activity }: Props) {
    return (
        <Segment.Group>
            <Segment>
                {activity.isCancelled &&
                    <Label attached='top' color='red' content='Cancelled' style={{textAling: 'center'}} />
                }
                <Item.Group>
                    <Item>
                        <Item.Image size='tiny' circular src='/assets/user.png' />
                        <Item.Content>
                            <Item.Header as={Link} to={`/activities/${activity.id}`}>
                                {activity.title}
                            </Item.Header>
                            <Item.Description>Hosted by {activity.host?.displayName}</Item.Description>
                            {activity.isHost && (
                                <Item.Description>
                                    <Label basic color='orange'>
                                        You are hosting this activity
                                    </Label>
                                </Item.Description>
                            )}
                            {activity.isGoing && !activity.isHost && (
                                <Item.Description>
                                    <Label basic color='green'>
                                        You are going to this activity
                                    </Label>
                                </Item.Description>
                            )}
                        </Item.Content>
                    </Item>
                </Item.Group>
            </Segment>
            <Segment>
                <span>
                    <Icon name='clock' /> {format(activity.date!, 'dd MMM yyyy h:mm aa')}
                    <Icon name='marker' /> {activity.venue}
                </span>
            </Segment>
            <Segment>
                <ActivityListItemAttendee attendees={activity.attendees!} />
            </Segment>
            <Segment clearing>
                <span>{activity.description}</span>
                <Button
                    as={Link}
                    to={`/activities/${activity.id}`}
                    color='teal'
                    floated='right'
                    content='View'
                />
            </Segment>
        </Segment.Group>
    );
}
```

##### 176 Añadir una ficha flotante para los asistentes

```tsx
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, Icon, Image } from 'semantic-ui-react';
import { Profile } from '../../app/models/profile';

interface Props {
    profile: Profile
}

export default observer(function ProfileCard({ profile }: Props) {
    return (
        <Card as={Link} to={`/profiles/${profile.username}`}>
            <Image src={profile.image || '/assets/user.png'} />
            <Card.Content>
                <Card.Header>{profile.displayName}</Card.Header>
                <Card.Description>Bio goes here</Card.Description>
            </Card.Content>
            <Card.Content extra>
                <Icon name='user' />
            20 followers
        </Card.Content>
        </Card>
    )
})
```

Se modifica `ActivityListItemAttendee`.

```tsx
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Link } from 'react-router-dom';
import { Image, List, Popup } from 'semantic-ui-react';
import { Profile } from '../../../app/models/profile';
import ProfileCard from '../../profiles/ProfileCard';

interface Props {
    attendees: Profile[];
}

export default observer(function ActivityListItemAttendee({ attendees }: Props) {
    return (
        <List horizontal>
            {attendees.map(attendee => (
                <Popup
                    hoverable
                    key={attendee.username}
                    trigger={
                        <List.Item key={attendee.username} as={Link} to={`/profiles/${attendee.username}`}>
                            <Image size='mini' circular src={attendee.image || '/assets/user.png'} />
                        </List.Item>
                    }
                >
                    <Popup.Content>
                        <ProfileCard profile={attendee} />
                    </Popup.Content>
                </Popup>
            ))}
        </List>
    )
})
```

##### 177 Sumario de la sección 15

#### Sección 17: Carga de imágenes en la API

##### 178 Introducción

- Opciones de almacenaje de fotos
  - Base de datos
  - Sistema de archivos
  - Servicio de nube

- Añadir un servicio de carga de fotos

- Utilizar la API de Cloudinary

![Architecture](/home/joan/e-learning/udemy/reactivities/doc/images/178.1.png)

De esta forma la aplicación no tiene porqué saber dónde se alojan las imágenes. Sólo necesita obtener el URL de acceso para guardarlo en la base de datos.

<img src="/home/joan/e-learning/udemy/reactivities/doc/images/178.2.png" style="zoom: 80%;" />

##### 179 Añadir Cloudinary

Empezamos por configurar Cloudinary en nuestra aplicación.

```bash
dotnet add /home/joan/e-learning/udemy/reactivities/Infrastructure/Infrastructure.csproj package CloudinaryDotNet -v 1.15.1 -s https://api.nuget.org/v3/index.json
```

Las claves de configuración se registran en `appsettings.json.`

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.Hosting.Lifetime": "Information"
    }
  },
  "AllowedHosts": "*",
  "Cloudinary": {
    "CloudName": "alkaidpmi",
    "ApiKey": "649628228889621",
    "ApiSecret": "***"
  }
}

```

Se crea la clase `CloudinarySettings`.

```c#
namespace Infrastructure.Photos
{
    public class CloudinarySettings
    {
        public string CloudName { get; set; }
        public string ApiKey { get; set; }
        public string ApiSecret { get; set; }
    }
}
```

Se da acceso a la configuración desde `Startup`, en `ApplicationServiceExtensions`.

```c#
services.AddMediatR(typeof(List.Handler).Assembly);
services.AddAutoMapper(typeof(Application.Core.MappingProfiles).Assembly);
services.AddScoped<IUserAccessor, UserAccessor>();
services.Configure<CloudinarySettings>(config.GetSection("Cloudinary")); // genial!
```

##### 180 Añadir las interfaces de Cloudinary

Se crea `PhotoUploadResult`.

```c#
namespace Application.Photos
{
    public class PhotoUploadResult
    {
        public string PublicId { get; set; }
        public string Url { get; set; }
    }
}
```

Se crea la interfaz `IPhotoAccesor`.

```c#
using System.Threading.Tasks;
using Application.Photos;
using Microsoft.AspNetCore.Http;

namespace Application.Interfaces
{
    public interface IPhotoAccessor
    {
        Task<PhotoUploadResult> AddPhoto(IFormFile file);
        Task<string> DeletePhoto(string publicId);
    }
}
```

Se crea la clase PhotoAccessor.

```c#
using System.Threading.Tasks;
using Application.Interfaces;
using Application.Photos;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Photos
{
    public class PhotoAccessor : IPhotoAccessor
    {
        public Task<PhotoUploadResult> AddPhoto(IFormFile file)
        {
            throw new System.NotImplementedException();
        }

        public Task<string> DeletePhoto(string publicId)
        {
            throw new System.NotImplementedException();
        }
    }
}
```

Se crea un nuevo servicio en `ApplicationServiceExtensions`.

```c#
services.AddMediatR(typeof(List.Handler).Assembly);
services.AddAutoMapper(typeof(Application.Core.MappingProfiles).Assembly);
services.AddScoped<IUserAccessor, UserAccessor>();
services.AddScoped<IPhotoAccessor, PhotoAccessor>(); // nuevo servicio
services.Configure<CloudinarySettings>(config.GetSection("Cloudinary"));
```

##### 181 Añadir la lógica de foto

Desarrollada en `PhotoAccessor`.  Es necesario acceder a la configuración de Cloudinary.

```c#
using System;
using System.Threading.Tasks;
using Application.Interfaces;
using Application.Photos;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace Infrastructure.Photos
{
    public class PhotoAccessor : IPhotoAccessor
    {
        private readonly Cloudinary _cloudinary;
        public PhotoAccessor(IOptions<CloudinarySettings> config)
        {
            var account = new Account(
                config.Value.CloudName,
                config.Value.ApiKey,
                config.Value.ApiSecret
            );
            _cloudinary = new Cloudinary(account);
        }

        public async Task<PhotoUploadResult> AddPhoto(IFormFile file)
        {
            if (file.Length > 0)
            {
                await using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Transformation = new Transformation().Height(500).Width(500).Crop("fill") // Cuadrada
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);

                if (uploadResult.Error != null)
                {
                    throw new Exception(uploadResult.Error.Message);
                }

                return new PhotoUploadResult
                {
                    PublicId = uploadResult.PublicId,
                    Url = uploadResult.SecureUrl.ToString()
                };
            }

            return null;
        }

        public async Task<string> DeletePhoto(string publicId)
        {
            var deleteParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deleteParams);
            return result.Result == "ok" ? result.Result : null;
        }
    }
}
```

##### 182 Añadir la entidad Foto

Se pasa a desarrollar la lógica de la aplicación.

Se crea la clase `Photo`.

```c#
namespace Domain
{
    public class Photo
    {
        public string Id { get; set; }
        public string Url { get; set; }
        public bool IsMain { get; set; }
    }
}
```

Se ajusta la clase `AppUser` para incluir la lista de fotos de un usuario.

```c#
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;

namespace Domain
{
    public class AppUser : IdentityUser
    {
        public string  DisplayName { get; set; }
        public string Bio { get; set; }
        public ICollection<ActivityAttendee> Activities { get; set; }
        public ICollection<Photo> Photos { get; set; }
    }
}
```

Se añade la colección en `DataContext`.

```c#
public DbSet<Activity> Activities { get; set; }
public DbSet<ActivityAttendee> ActivityAttendees { get; set; }
public DbSet<Photo> Photos { get; set; } // colección de fotos
```

Se crea una nueva migración.

```bash
[joan@alkaid reactivities]$ dotnet ef migrations add PhotoEntityAdded -p Persistence -s API
Build started...
Build succeeded.
info: Microsoft.EntityFrameworkCore.Infrastructure[10403]
      Entity Framework Core 5.0.4 initialized 'DataContext' using provider 'Microsoft.EntityFrameworkCore.Sqlite' with options: None
Done. To undo this action, use 'ef migrations remove'
```

Se revisa el archivo de migración y se arranca la aplicación para que se cree la nueva tabla.

##### 183 Añadir el manipulador de fotos

Se crea la clase `Add`.

```c#
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Core;
using Application.Interfaces;
using Domain;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Photos
{
    public class Add
    {
        public class Command : IRequest<Result<Photo>>
        {
            public IFormFile File { get; set; }
        }

        public class Handler : IRequestHandler<Command, Result<Photo>>
        {
            private readonly DataContext _context;
            private readonly IPhotoAccessor _photoAccessor;
            private readonly IUserAccessor _userAccessor;
            public Handler(DataContext context, IPhotoAccessor photoAccessor, IUserAccessor userAccessor)
            {
                _userAccessor = userAccessor;
                _photoAccessor = photoAccessor;
                _context = context;
            }

            public async Task<Result<Photo>> Handle(Command request, CancellationToken cancellationToken)
            {
                var user = await _context.Users.Include(p => p.Photos)
                    .FirstOrDefaultAsync(x => x.UserName == _userAccessor.GetUserName());

                if (user == null) return null;

                var photoUploadResult = await _photoAccessor.AddPhoto(request.File);

                var photo = new Photo
                {
                    Url = photoUploadResult.Url,
                    Id = photoUploadResult.PublicId
                };

                if (!user.Photos.Any(x => x.IsMain)) photo.IsMain = true;

                user.Photos.Add(photo);

                var result = await _context.SaveChangesAsync() > 0;

                if (result) return Result<Photo>.Success(photo);
                
                return Result<Photo>.Failure("Problem adding photo");
            }
        }
    }
}
```

##### 184 Añadir el controlador de fotos

Se crea un nuevo controlador.

```c#
using System.Threading.Tasks;
using Application.Photos;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class PhotosController : BaseApiController
    {
        [HttpPost]
        public async Task<IActionResult> Add([FromForm] Add.Command command)
        {
            return HandleResult(await Mediator.Send(command));
        }
    }
}
```

Es necesario reiniciar el servidor para realizar pruebas.

* Login as bob and save token env
* Add Photo

![](/home/joan/e-learning/udemy/reactivities/doc/images/184.1.png)

![](/home/joan/e-learning/udemy/reactivities/doc/images/184.2.png)

##### 185 Eliminar fotos

Se crea la clase `Delete`.

```c#
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Core;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Photos
{
    public class Delete
    {
        public class Command : IRequest<Result<Unit>>
        {
            public string Id { get; set; }
        }

        public class Handler : IRequestHandler<Command, Result<Unit>>
        {
            private readonly DataContext _context;
            private readonly IPhotoAccessor _photoAccessor;
            private readonly IUserAccessor _userAccessor;
            public Handler(DataContext context, IPhotoAccessor photoAccessor, IUserAccessor userAccessor)
            {
                _userAccessor = userAccessor;
                _photoAccessor = photoAccessor;
                _context = context;
            }

            public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
            {
                var user = await _context.Users.Include(p => p.Photos)
                    .FirstOrDefaultAsync(x => x.UserName == _userAccessor.GetUserName());

                if (user == null) return null;

                var photo = user.Photos.FirstOrDefault(x => x.Id == request.Id);

                if (photo == null) return null;

                if (photo.IsMain) return Result<Unit>.Failure("You cannot delete your main photo");

                var result = await _photoAccessor.DeletePhoto(photo.Id);

                if (result== null) return Result<Unit>.Failure("Problem deleting photo from repository");

                user.Photos.Remove(photo);

                var success = await _context.SaveChangesAsync() > 0;

                if (success) return Result<Unit>.Success(Unit.Value);

                return Result<Unit>.Failure("Problem deleting photo");
            }
        }
    }
}
```

Se añade un punto final al controlador.

```c#
using System.Threading.Tasks;
using Application.Photos;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class PhotosController : BaseApiController
    {
        [HttpPost]
        public async Task<IActionResult> Add([FromForm] Add.Command command)
        {
            return HandleResult(await Mediator.Send(command));
        }
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            return HandleResult(await Mediator.Send(new Delete.Command { Id = id }));
        }
    }
}
```

##### 186 Configurar la foto principal

Se crea la clase `SetMain`.

```c#
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Core;
using Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Photos
{
    public class SetMain
    {
        public class Command : IRequest<Result<Unit>>
        {
            public string Id { get; set; }
        }

        public class Handler : IRequestHandler<Command, Result<Unit>>
        {
            private readonly DataContext _context;
            private readonly IUserAccessor _userAccessor;
            public Handler(DataContext context, IUserAccessor userAccessor)
            {
                _userAccessor = userAccessor;
                _context = context;
            }

            public async Task<Result<Unit>> Handle(Command request, CancellationToken cancellationToken)
            {
                var user = await _context.Users.Include(p => p.Photos)
                    .FirstOrDefaultAsync(x => x.UserName == _userAccessor.GetUserName());

                if (user == null) return null;

                var photo = user.Photos.FirstOrDefault(x => x.Id == request.Id);

                if (photo == null) return null;

                var currentMain = user.Photos.FirstOrDefault(x => x.IsMain);

                if (currentMain != null) currentMain.IsMain = false;

                photo.IsMain = true;

                var success = await _context.SaveChangesAsync() > 0;

                if (success) return Result<Unit>.Success(Unit.Value);

                return Result<Unit>.Failure("Problem setting main photo");
            }
        }
    }
}
```

Se crea un nuevo punto final el en controlador de fotos.

```c#
using System.Threading.Tasks;
using Application.Photos;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class PhotosController : BaseApiController
    {
        [HttpPost]
        public async Task<IActionResult> Add([FromForm] Add.Command command)
        {
            return HandleResult(await Mediator.Send(command));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            return HandleResult(await Mediator.Send(new Delete.Command { Id = id }));
        }

        [HttpPost("{id}/setMain")]
        public async Task<IActionResult> SetMain(string id)
        {
            return HandleResult(await Mediator.Send(new SetMain.Command { Id = id}));
        }
    }
}
```

Las pruebas se posponen a poder obtener la lista de fotos de un usuario.

##### 187 Retornar los perfiles de usuario

Se modifica la clase `Profile` para considerar una lista de fotos.

```c#
using System.Collections.Generic;
using Domain;

namespace Application.Profiles
{
    public class Profile
    {
        public string Username { get; set; }
        public string DisplayName { get; set; }
        public string Bio { get; set; }
        public string Image { get; set; }
        public ICollection<Photo> Photos { get; set; }
    }
}
```

Se crea la clase `Details`.

```c#
using System.Threading;
using System.Threading.Tasks;
using Application.Core;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Profiles
{
    public class Details
    {
        public class Query : IRequest<Result<Profile>>
        {
            public string Username { get; set; }
        }

        public class Handler : IRequestHandler<Query, Result<Profile>>
        {
            private readonly DataContext _context;
            private readonly IMapper _mapper;
            public Handler(DataContext context, IMapper mapper)
            {
                _mapper = mapper;
                _context = context;
            }

            public async Task<Result<Profile>> Handle(Query request, CancellationToken cancellationToken)
            {
                var user = await _context.Users
                    .ProjectTo<Profile>(_mapper.ConfigurationProvider)
                    .SingleOrDefaultAsync(x => x.Username == request.Username);

                if (user == null) return null;

                return Result<Profile>.Success(user);
            }
        }
    }
}
```

Se requiere un controlador para obtener el perfil de un usuario.

```c#
using System.Threading.Tasks;
using Application.Profiles;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class ProfilesController : BaseApiController
    {
        [HttpGet("{username}")]
        public async Task<IActionResult> GetProfile(string username)
        {
            return HandleResult(await Mediator.Send(new Details.Query {Username = username}));
        }
    }
}
```

Vamos a tener problemas con `AutoMapper` porque no existe una correspondencia entre `AppUser` y `Profile`, en `MappingProfiles`.

```c#
var user = await _context.Users
    .ProjectTo<Profile>(_mapper.ConfigurationProvider)
    .SingleOrDefaultAsync(x => x.Username == request.Username);
```

##### 188 Actualizar la configuración de correspondencias

```c#
using System.Linq;
using Application.Activities;
using AutoMapper;
using Domain;

namespace Application.Core
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            CreateMap<Activity, Activity>();
            CreateMap<Activity, ActivityDto>()
                .ForMember(d => d.HostUsername, opt => opt.MapFrom(s => s.Attendees
                    .FirstOrDefault(x => x.IsHost).AppUser.UserName));
            CreateMap<ActivityAttendee, Profiles.Profile>()
                .ForMember(d => d.DisplayName, opt => opt.MapFrom(s => s.AppUser.DisplayName))
                .ForMember(d => d.Username, opt => opt.MapFrom(s => s.AppUser.UserName))
                .ForMember(d => d.Bio, opt => opt.MapFrom(s => s.AppUser.Bio));
            CreateMap<AppUser, Profiles.Profile>()
                .ForMember(d => d.Image, o => o.MapFrom(s => s.Photos.FirstOrDefault(f => f.IsMain).Url));
        }
    }
}
```

![](/home/joan/e-learning/udemy/reactivities/doc/images/188.1.png)

Además se realizan pruebas de cambio de foto principal y de borrar fotos.

##### 189 Devolver un DTO de asistente

No se están mandando las fotos de los asistentes a una actividad.

![](/home/joan/e-learning/udemy/reactivities/doc/images/189.1.png)

Se crea un DTO de asistente. No interesa la lista de fotos, sólo la principal.

```c#
namespace Application.Activities
{
    public class AttendeeDto
    {
        public string Username { get; set; }
        public string DisplayName { get; set; }
        public string Bio { get; set; }
        public string Image { get; set; }
    }
}
```

`ActivityDto` manejará una lista de `AttendeeDto` en lugar de `Profile`.

```c#
using System;
using System.Collections.Generic;
using Application.Profiles;

namespace Application.Activities
{
    public class ActivityDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public DateTime Date { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public string City { get; set; }
        public string Venue { get; set; }
        public string HostUsername { get; set; }
        public bool IsCancelled { get; set; }
        public ICollection<AttendeeDto> Attendees { get; set; }
    }
}
```

Hay que adaptar los perfiles de correspondencias de `Profiles.Profile` a `AttendeeDto` y añadir la imagen principal.

```c#
using System.Linq;
using Application.Activities;
using AutoMapper;
using Domain;

namespace Application.Core
{
    public class MappingProfiles : Profile
    {
        public MappingProfiles()
        {
            CreateMap<Activity, Activity>();
            CreateMap<Activity, ActivityDto>()
                .ForMember(d => d.HostUsername, opt => opt.MapFrom(s => s.Attendees
                    .FirstOrDefault(x => x.IsHost).AppUser.UserName));
            CreateMap<ActivityAttendee, AttendeeDto>()
                .ForMember(d => d.DisplayName, opt => opt.MapFrom(s => s.AppUser.DisplayName))
                .ForMember(d => d.Username, opt => opt.MapFrom(s => s.AppUser.UserName))
                .ForMember(d => d.Bio, opt => opt.MapFrom(s => s.AppUser.Bio))
                .ForMember(d => d.Image, o => o.MapFrom(s => s.AppUser.Photos.FirstOrDefault(f => f.IsMain).Url));
            CreateMap<AppUser, Profiles.Profile>()
                .ForMember(d => d.Image, o => o.MapFrom(s => s.Photos.FirstOrDefault(f => f.IsMain).Url));
        }
    }
}
```

Se actualiza `CreateUserObject` en `AccountController`. La imagen deja de ser `null` para ser la imagen principal.

```c#
private UserDto CreateUserObject(AppUser user)
{
    return new UserDto
    {
        DisplayName = user.DisplayName,
        Image = user?.Photos?.FirstOrDefault(x => x.IsMain)?.Url,
        Token = _tokenService.CreateToken(user),
        Username = user.UserName
    };
}
```

Se actualiza `Login` en `AccountController` para cargar las fotos del usuario.

Antes.
```c#
var user = await _userManager.FindByEmailAsync(loginDto.Email);
```
Después.
```c#
var user = await _userManager.Users.Include(p => p.Photos)
    .FirstOrDefaultAsync(x => x.Email == loginDto.Email);
```

Lo mismo para `GetCurrentUser`.

Antes.

```c#
var user = await _userManager.FindByEmailAsync(User.FindFirstValue(ClaimTypes.Email));
```

Después.

```c#
var user = await _userManager.Users.Include(p => p.Photos)
    .FirstOrDefaultAsync(x => x.Email == User.FindFirstValue(ClaimTypes.Email));
```

##### 190 Sumario de la sección 16

#### Sección 17: Cargar imágenes en el cliente

##### 191 Introducción

* Añadir una página de perfil
* Mostrar las fotos de usuario
* Añadir un artilugio para cargar fotos
* React dropzone
* React cropper
* Configurar la foto principal
* Eliminar fotos

##### 192 Crear una página de perfil

Se crea un componente `ProfilePage`.

```tsx
import React from 'react';

export default function ProfilePage() {
    return (
        <h1>Profile</h1>
    )
}
```

Se añade una ruta para este componente.

```tsx
import React, { useEffect } from 'react';
import { Container } from 'semantic-ui-react';
import NavBar from './NavBar';
import ActivityDashboard from '../../features/activities/dashboard/ActivityDashboard';
import { observer } from 'mobx-react-lite';
import { Route, Switch, useLocation } from 'react-router';
import HomePage from '../../features/home/HomePage';
import ActivityForm from '../../features/activities/form/ActivityForm';
import ActivityDetails from '../../features/activities/details/ActivityDetails';
import TestErrors from '../../features/errors/TestError';
import { ToastContainer } from 'react-toastify';
import NotFound from '../../features/errors/NotFound';
import ServerError from '../../features/errors/ServerError';
import LoginForm from '../../features/users/LoginForm';
import { useStore } from '../stores/store';
import LoadingComponent from './LoadingComponent';
import ModalContainer from '../common/modals/ModalContainer';
import ProfilePage from '../../features/profiles/ProfilePage';

function App() {
  const location = useLocation();
  const { commonStore, userStore } = useStore();

  useEffect(() => {
    if (commonStore.token) {
      userStore.getUser().finally(() => commonStore.setAppLoaded());
    } else {
      commonStore.setAppLoaded();
    }
  }, [commonStore, userStore])

  if (!commonStore.appLoaded) return <LoadingComponent content='Loading app...' />

  // </> equival a emprar <Fragment/>
  return (
    <>
      <ToastContainer position='bottom-right' hideProgressBar />
      <ModalContainer />

      <Route exact path='/' component={HomePage} />
      <Route
        path={'/(.+)'}
        render={() => (
          <>
            <NavBar />
            <Container style={{ marginTop: '7em' }}>
              <Switch>
                <Route exact path='/activities' component={ActivityDashboard} />
                <Route path='/activities/:id' component={ActivityDetails} />
                <Route key={location.key} path={['/createActivity', '/manage/:id']} component={ActivityForm} />
                <Route path='/profiles/:username' component={ProfilePage} />
                <Route path='/errors' component={TestErrors} />
                <Route path='/server-error' component={ServerError} />
                <Route path='/login' component={LoginForm} />
                <Route component={NotFound} />
              </Switch>
            </Container>
          </>
        )}
      />
    </>
  );
}

export default observer(App);
```

Los enlaces ya están preparados, excepto el del menú. Le faltaba una 's'.

```tsx
<Dropdown.Item as={Link} to={`/profiles/${user?.username}`}
```

Se crea el componente `ProfileHeader`.

```tsx
import React from 'react';
import { Button, Divider, Grid, Header, Item, Reveal, Segment, Statistic } from 'semantic-ui-react';

export default function ProfileHeader() {
    return (
        <Segment>
            <Grid>
                <Grid.Column width={12}>
                    <Item.Group>
                        <Item>
                            <Item.Image avatar size='small' src={'/assets/user.png'} />
                            <Item.Content verticalAlign='middle'>
                                <Header as='h1' content='Displayname' />
                            </Item.Content>
                        </Item>
                    </Item.Group>
                </Grid.Column>
                <Grid.Column width={4}>
                    <Statistic.Group widths={2}>
                        <Statistic label='Followers' value='5' />
                        <Statistic label='Following' value='42' />
                    </Statistic.Group>
                    <Divider />
                    <Reveal animated='move'>
                        <Reveal.Content visible style={{ width: '100%' }}>
                            <Button fluid color='teal' content='Following' />
                        </Reveal.Content>
                        <Reveal.Content hidden style={{ width: '100%' }}>
                            <Button
                                fluid
                                basic
                                color={true ? 'red' : 'green'}
                                content={true ? 'Unfollow' : 'Follow'}
                            />
                        </Reveal.Content>
                    </Reveal>
                </Grid.Column>
            </Grid>
        </Segment>
    )
}
```

Que se usa en `ProfilePage`.

```tsx
import React from 'react';
import { Grid } from 'semantic-ui-react';
import ProfileHeader from './ProfileHeader';

export default function ProfilePage() {
    return (
        <Grid>
            <Grid.Column width={16}>
                <ProfileHeader />
            </Grid.Column>
        </Grid>
    )
}
```

##### 194 Añadir el contenido del perfil

Se crea el componente `ProfileContent`.

```tsx
import React from 'react';
import { Tab } from 'semantic-ui-react';

export default function ProfileContent() {
    const panes = [
        {menuItem: 'About', render: () => <Tab.Pane>About content</Tab.Pane>},
        {menuItem: 'Photos', render: () => <Tab.Pane>Photos content</Tab.Pane>},
        {menuItem: 'Events', render: () => <Tab.Pane>Events content</Tab.Pane>},
        {menuItem: 'Followers', render: () => <Tab.Pane>Followers content</Tab.Pane>},
        {menuItem: 'Following', render: () => <Tab.Pane>Following content</Tab.Pane>}
    ];


    return (
        <Tab
            menu={{fluid: true, vertical: true}}
            menuPosition='right'
            panes={panes}
        />
    )
}
```

Se incluye en `ProfilePage`.

```tsx
import React from 'react';
import { Grid } from 'semantic-ui-react';
import ProfileContent from './ProfileContent';
import ProfileHeader from './ProfileHeader';

export default function ProfilePage() {
    return (
        <Grid>
            <Grid.Column width={16}>
                <ProfileHeader />
                <ProfileContent />
            </Grid.Column>
        </Grid>
    )
}
```

##### 195 Obtener los datos de perfil

Se requiere una interfaz para `Photo`, en `app/models/profile.ts`, que se utiliza en la interfaz `Profile`.

```tsx
import { User } from "./user";

export interface Profile {
    username: string;
    displayName: string;
    image?: string;
    bio?: string;
    photos?: Photo[];
}

export class Profile implements Profile {
    constructor(user: User) {
        this.username = user.username;
        this.displayName = user.displayName;
        this.image = user.image;
    }
}

export interface Photo {
    id: string;
    url: string;
    isMain: boolean;
}
```

Se adapta `agent.ts`. Se crea un objeto con las operaciones de `Profile`, en este caso `get` únicamente.

```tsx
const Profiles = {
    get: (username: string) => requests.get<Profile>(`/profiles/${username}`)
}

const agent = {
    Activities,
    Account,
    Profiles
}
```

Se crea el almacén de perfiles `ProfileStore` en `profileStore.ts`.

```tsx
import { makeAutoObservable, runInAction } from "mobx";
import agent from "../api/agent";
import { Profile } from "../models/profile";

export default class ProfileStore {
    profile: Profile | null = null;
    loadingProfile = false;

    constructor() {
        makeAutoObservable(this);
    }

    loadProfile = async (username: string) => {
        this.loadingProfile = true;
        try {
            const profile = await agent.Profiles.get(username);
            runInAction(() => {
                this.profile = profile;
                this.loadingProfile = false;
            })
        } catch (error) {
            console.log(error);
            runInAction(() => this.loadingProfile = false);
        }
    }
}
```

Se añade en la lista de almacenes.

```tsx
import { createContext, useContext } from "react";
import ActivityStore from "./activityStore";
import CommonStore from "./commonStore";
import ModalStore from "./modalStore";
import ProfileStore from "./profileStore";
import UserStore from "./userStore";

interface Store {
    activityStore: ActivityStore;
    commonStore: CommonStore;
    userStore: UserStore;
    modalStore: ModalStore;
    profileStore: ProfileStore;
}

export const store: Store = {
    activityStore: new ActivityStore(),
    commonStore: new CommonStore(),
    userStore: new UserStore(),
    modalStore: new ModalStore(),
    profileStore: new ProfileStore()
}

export const StoreContext = createContext(store);

export function useStore() {
    return useContext(StoreContext);
}
```

##### 196 Obtener los datos de perfil 2ª parte

Se adaptan `ProfilePage` y `ProfileHeader`.

```tsx
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { useParams } from 'react-router';
import { Grid } from 'semantic-ui-react';
import LoadingComponent from '../../app/layout/LoadingComponent';
import { useStore } from '../../app/stores/store';
import ProfileContent from './ProfileContent';
import ProfileHeader from './ProfileHeader';

export default observer(function ProfilePage() {
    const { username } = useParams<{ username: string }>();
    const { profileStore } = useStore();
    const { loadingProfile, loadProfile, profile } = profileStore;

    useEffect(() => {
        loadProfile(username)
    }, [loadProfile, username])

    if (loadingProfile) return <LoadingComponent content='Loading profile...' />

    return (
        <Grid>
            <Grid.Column width={16}>
                {profile && <ProfileHeader profile={profile} />}
                <ProfileContent />
            </Grid.Column>
        </Grid>
    )
})
```

```tsx
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Button, Divider, Grid, Header, Item, Reveal, Segment, Statistic } from 'semantic-ui-react';
import { Profile } from '../../app/models/profile';

interface Props {
    profile: Profile
}

export default observer(function ProfileHeader({profile}: Props) {
    return (
        <Segment>
            <Grid>
                <Grid.Column width={12}>
                    <Item.Group>
                        <Item>
                            <Item.Image avatar size='small' src={profile?.image || '/assets/user.png'} />
                            <Item.Content verticalAlign='middle'>
                                <Header as='h1' content={profile?.displayName} />
                            </Item.Content>
                        </Item>
                    </Item.Group>
                </Grid.Column>
                <Grid.Column width={4}>
                    <Statistic.Group widths={2}>
                        <Statistic label='Followers' value='5' />
                        <Statistic label='Following' value='42' />
                    </Statistic.Group>
                    <Divider />
                    <Reveal animated='move'>
                        <Reveal.Content visible style={{ width: '100%' }}>
                            <Button fluid color='teal' content='Following' />
                        </Reveal.Content>
                        <Reveal.Content hidden style={{ width: '100%' }}>
                            <Button
                                fluid
                                basic
                                color={true ? 'red' : 'green'}
                                content={true ? 'Unfollow' : 'Follow'}
                            />
                        </Reveal.Content>
                    </Reveal>
                </Grid.Column>
            </Grid>
        </Segment>
    )
})
```

##### 196 Mostrar las fotos

Se crea el componente `ProfilePhotos` y se incluye en `ProfileContent`.

```tsx
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Card, Header, Image, Tab } from 'semantic-ui-react';
import { useStore } from '../../app/stores/store';

export default observer(function ProfilePhotos() {
    const { profileStore } = useStore();

    return (
        <Tab.Pane>
            <Header icon='image' content='Photos' />
            <Card.Group itemsPerRow={5}>
                <Card>
                    <Image src={'/assets/user.png'} />
                </Card>
                <Card>
                    <Image src={'/assets/user.png'} />
                </Card>
                <Card>
                    <Image src={'/assets/user.png'} />
                </Card>
            </Card.Group>
        </Tab.Pane>
    )
})
```

```tsx
import React from 'react';
import { Tab } from 'semantic-ui-react';
import ProfilePhotos from './ProfilePhotos';

export default function ProfileContent() {
    const panes = [
        {menuItem: 'About', render: () => <Tab.Pane>About content</Tab.Pane>},
        {menuItem: 'Photos', render: () => <Tab.Pane><ProfilePhotos /></Tab.Pane>},
        {menuItem: 'Events', render: () => <Tab.Pane>Events content</Tab.Pane>},
        {menuItem: 'Followers', render: () => <Tab.Pane>Followers content</Tab.Pane>},
        {menuItem: 'Following', render: () => <Tab.Pane>Following content</Tab.Pane>}
    ];

    return (
        <Tab
            menu={{fluid: true, vertical: true}}
            menuPosition='right'
            panes={panes}
        />
    )
}
```

![](/home/joan/e-learning/udemy/reactivities/doc/images/196.1.png)

Se adaptan `ProfilePage`, `ProfileContent` y `ProfilePhotos` para mostrar la lista de fotos del perfil.

```tsx
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Card, Header, Image, Tab } from 'semantic-ui-react';
import { Profile } from '../../app/models/profile';

interface Props {
    profile: Profile
}

export default observer(function ProfilePhotos({ profile }: Props) {
    return (
        <Tab.Pane>
            <Header icon='image' content='Photos' />
            <Card.Group itemsPerRow={5}>
                {profile.photos?.map(photo => (
                    <Card key={photo.id}>
                        <Image src={photo.url} />
                    </Card>
                ))}
            </Card.Group>
        </Tab.Pane>
    )
})
```

##### 198 Representación condicional del artilugio de fotos

En el caso de que el perfil mostrado sea el del usuario identificado, se dará la posibilidad de gestionar la lista de fotos.

Se modifica el almacén de perfiles para añadir la propiedad calculada `isCurrentUser`.

```tsx
import { makeAutoObservable, runInAction } from "mobx";
import agent from "../api/agent";
import { Profile } from "../models/profile";
import { store } from "./store";

export default class ProfileStore {
    profile: Profile | null = null;
    loadingProfile = false;

    constructor() {
        makeAutoObservable(this);
    }

    get isCurrentUser() {
        if (store.userStore.user && this.profile) {
            return store.userStore.user.username === this.profile.username;
        }
        return false;
    }

    loadProfile = async (username: string) => {
        this.loadingProfile = true;
        try {
            const profile = await agent.Profiles.get(username);
            runInAction(() => {
                this.profile = profile;
                this.loadingProfile = false;
            })
        } catch (error) {
            console.log(error);
            runInAction(() => this.loadingProfile = false);
        }
    }
}
```

Se adapta el componente `ProfilePhotos`.

```tsx
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Button, Card, Grid, Header, Image, Tab } from 'semantic-ui-react';
import { Profile } from '../../app/models/profile';
import { useStore } from '../../app/stores/store';

interface Props {
    profile: Profile
}

export default observer(function ProfilePhotos({ profile }: Props) {
    const { profileStore: { isCurrentUser } } = useStore();
    const [addPhotoMode, setAddPhotoMode] = useState(false);

    return (
        <Tab.Pane>
            <Grid>
                <Grid.Column width={16}>
                    <Header floated='left' icon='image' content='Photos' />
                    {isCurrentUser && (
                        <Button floated='right' basic
                            content={addPhotoMode ? 'Cancel' : 'Add Photo'}
                            onClick={() => setAddPhotoMode(!addPhotoMode)}
                        />
                    )}
                </Grid.Column>
                <Grid.Column width={16}>
                    {addPhotoMode ? (
                        <p>Photo widget goes here</p>
                    ) : (
                        <Card.Group itemsPerRow={5}>
                            {profile.photos?.map(photo => (
                                <Card key={photo.id}>
                                    <Image src={photo.url} />
                                </Card>
                            ))}
                        </Card.Group>
                    )}
                </Grid.Column>
            </Grid>
        </Tab.Pane>
    )
})
```

##### 199 Crear un artilugio de carga de fotos

Se pretende que sea reutilizable, en cualquier parte de la aplicación. `PhotoUploadWidget` se crea en la nueva carpeta `src/app/common/imageUpload`.

La carga de una foto se va a realizar en 3 pasos. Se diseña la apariencia del artilugio.

```tsx
import React from 'react';
import { Grid, Header } from 'semantic-ui-react';

export default function PhotoUploadWidget() {
    return (
        <Grid>
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 1 - Add Photo' />
            </Grid.Column>
            <Grid.Column width={1} />
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 2 - Resize image' />
            </Grid.Column>
            <Grid.Column width={1} />
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 3 - Preview & Upload' />
            </Grid.Column>
        </Grid>
    )
}
```

##### 200 Añadir una zona de dejar caer

https://github.com/react-dropzone/react-dropzone

Se va a utilizar la alternativa de gancho. Se copia el ejemplo de la página del proyecto para crear `PhotoWidgetDropzone`, con algunos cambios mínimos.

Se instala el paquete.

```bash
[joan@alkaid client-app]$ npm install react-dropzone
```

```tsx
import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function PhotoWidgetDropzone() {
    const onDrop = useCallback(acceptedFiles => {
        console.log(acceptedFiles);
    }, [])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

    return (
        <div {...getRootProps()}>
            <input {...getInputProps()} />
            {
                isDragActive ?
                    <p>Drop the files here ...</p> :
                    <p>Drag 'n' drop some files here, or click to select files</p>
            }
        </div>
    )
}
```

Se añade el artilugio al primer paso en `PhotoUploadWidget` y se realiza una prueba.

![](/home/joan/e-learning/udemy/reactivities/doc/images/200.1.png)

##### 201 Dar estilo a la zona de dejar caer

Se incorpora estado local a `PhotoUploadWidget` para utilizarlo en `PhotoWidgetDropZone`.

```tsx
import React, { useState } from 'react';
import { Grid, Header, Image } from 'semantic-ui-react';
import PhotoWidgetDropzone from './PhotoWidgetDropzone';

export default function PhotoUploadWidget() {
    const [files, setFiles] = useState<any>([]);

    return (
        <Grid>
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 1 - Add Photo' />
                <PhotoWidgetDropzone setFiles={setFiles} />
            </Grid.Column>
            <Grid.Column width={1} />
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 2 - Resize image' />
                {files && files.length > 0 && (
                    <Image src={files[0].preview} />
                )}
            </Grid.Column>
            <Grid.Column width={1} />
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 3 - Preview & Upload' />
            </Grid.Column>
        </Grid>
    )
}
```

```tsx
import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Header, Icon } from 'semantic-ui-react'

interface Props {
    setFiles: (files: any) => void;
}

export default function PhotoWidgetDropzone({setFiles}: Props) {
    const dzStyles = {
        border: 'dashed 3px #eee',
        borderColor: '#eee',
        borderRadius: '5px',
        paddingTop: '30px',
        textAlign: 'center' as 'center',
        height: 200
    }

    const dzActive = {
        borderColor: 'green'
    }

    const onDrop = useCallback(acceptedFiles => {
        setFiles(acceptedFiles.map((file: any) => Object.assign(file, {
            preview: URL.createObjectURL(file)
        })))
    }, [setFiles])
    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

    return (
        <div {...getRootProps()} style={isDragActive ? {...dzStyles, ...dzActive} : {...dzStyles}} >
            <input {...getInputProps()} />
            <Icon name='upload' size='huge' />
            <Header content='Drop image here' />
        </div>
    )
}
```

![](/home/joan/e-learning/udemy/reactivities/doc/images/201.1.png)

##### 202 Añadir un cortador react

https://github.com/react-cropper/react-cropper

```bash
[joan@alkaid client-app]$ npm install react-cropper
```

Se crea el componente `PhotoWidgetCropper`. En las propiedades del cortador hay que indicar una función que se le pasará del componente que lo usa. Es el resultado de la operación de recorte, una imagen.

```tsx
import React from 'react';
import { Cropper } from 'react-cropper';
import 'cropperjs/dist/cropper.css';

interface Props {
    imagePreview: string;
    setCropper: (cropper: Cropper) => void;
}

export default function PhotoWidgetCropper({imagePreview, setCropper}: Props) {
    return (
        <Cropper
            src={imagePreview}
            style={{height:200, width: '100%'}}
            initialAspectRatio={1}
            aspectRatio={1}
            preview='.img-preview'
            guides={false}
            viewMode={1}
            autoCropArea={1}
            background={false}
            onInitialized={cropper => setCropper(cropper)}
        />
    )
}
```
```tsx
import React, { useEffect, useState } from 'react';
import { Cropper } from 'react-cropper';
import { Grid, Header } from 'semantic-ui-react';
import PhotoWidgetCropper from './PhotoWidgetCropper';
import PhotoWidgetDropzone from './PhotoWidgetDropzone';

export default function PhotoUploadWidget() {
    const [files, setFiles] = useState<any>([]);
    const [cropper, setCropper] = useState<Cropper>();

    function onCrop() {
        if (cropper) {
            cropper.getCroppedCanvas().toBlob(blob => console.log(blob))
        }
    }

    // se limpia la memoria utilizada en dropzone
    useEffect(() => {
        return () => {
            files.forEach((file: any) => URL.revokeObjectURL(file.preview))
        }
    }, [files])

    return (
        <Grid>
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 1 - Add Photo' />
                <PhotoWidgetDropzone setFiles={setFiles} />
            </Grid.Column>
            <Grid.Column width={1} />
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 2 - Resize image' />
                {files && files.length > 0 && (
                    <PhotoWidgetCropper setCropper={setCropper} imagePreview={files[0].preview} />
                )}
            </Grid.Column>
            <Grid.Column width={1} />
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 3 - Preview & Upload' />
                <div className='img-preview' style={{minHeight: 200, overflow: 'hidden'}} />
            </Grid.Column>
        </Grid>
    )
}
```

![](/home/joan/e-learning/udemy/reactivities/doc/images/202.1.png)

Se finaliza el diseño del artilugio de carga de fotos añadiendo los botones aceptar/cancelar.

```tsx
import React, { useEffect, useState } from 'react';
import { Cropper } from 'react-cropper';
import { Button, Grid, Header } from 'semantic-ui-react';
import PhotoWidgetCropper from './PhotoWidgetCropper';
import PhotoWidgetDropzone from './PhotoWidgetDropzone';

export default function PhotoUploadWidget() {
    const [files, setFiles] = useState<any>([]);
    const [cropper, setCropper] = useState<Cropper>();

    function onCrop() {
        if (cropper) {
            cropper.getCroppedCanvas().toBlob(blob => console.log(blob))
        }
    }

    // se limpia la memoria utilizada en dropzone
    useEffect(() => {
        return () => {
            files.forEach((file: any) => URL.revokeObjectURL(file.preview))
        }
    }, [files])

    return (
        <Grid>
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 1 - Add Photo' />
                <PhotoWidgetDropzone setFiles={setFiles} />
            </Grid.Column>
            <Grid.Column width={1} />
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 2 - Resize image' />
                {files && files.length > 0 && (
                    <PhotoWidgetCropper setCropper={setCropper} imagePreview={files[0].preview} />
                )}
            </Grid.Column>
            <Grid.Column width={1} />
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 3 - Preview & Upload' />
                {files && files.length > 0 &&
                <>
                    <div className='img-preview' style={{ minHeight: 200, overflow: 'hidden' }} />
                    <Button.Group widths={2}>
                        <Button onClick={onCrop} positive icon='check' />
                        <Button onClick={() => setFiles([])} icon='close' />
                    </Button.Group>
                </>}
            </Grid.Column>
        </Grid>
    )
}
```

![](/home/joan/e-learning/udemy/reactivities/doc/images/202.2.png)

##### 203 Añadir el método de carga de fotos

Se añade un método `uploadPhoto` en `agent`.

```tsx
const Profiles = {
    get: (username: string) => requests.get<Profile>(`/profiles/${username}`),
    uploadPhoto: (file: Blob) => {
        let formData = new FormData();
        formData.append('File', file);
        return axios.post<Photo>('photos', formData, {
            headers: {'Content-type': 'multipart/form-data'}
        })
    }
}
```

Hay que se muy cuidadoso con las cadenas de caracteres.

Se ajusta el almacén de perfiles y el de usuarios.

```tsx
import { makeAutoObservable, runInAction } from "mobx";
import agent from "../api/agent";
import { Profile } from "../models/profile";
import { store } from "./store";

export default class ProfileStore {
    profile: Profile | null = null;
    loadingProfile = false;
    uploading = false;

    constructor() {
        makeAutoObservable(this);
    }

    get isCurrentUser() {
        if (store.userStore.user && this.profile) {
            return store.userStore.user.username === this.profile.username;
        }
        return false;
    }

    loadProfile = async (username: string) => {
        this.loadingProfile = true;
        try {
            const profile = await agent.Profiles.get(username);
            runInAction(() => {
                this.profile = profile;
                this.loadingProfile = false;
            })
        } catch (error) {
            console.log(error);
            runInAction(() => this.loadingProfile = false);
        }
    }

    uploadPhoto = async (file: Blob) => {
        this.uploading = true;
        try {
            const response = await agent.Profiles.uploadPhoto(file);
            const photo = response.data;
            runInAction(() => {
                if (this.profile) {
                    this.profile.photos?.push(photo);
                    if (photo.isMain && store.userStore.user) {
                        store.userStore.setImage(photo.url);
                        this.profile.image = photo.url;
                    }
                }
                this.uploading = false;
            })
        } catch (error) {
            console.log(error);
            runInAction(() => this.uploading = false);
        }
    }
}
```

```tsx
import { makeAutoObservable, runInAction } from "mobx";
import { history } from "../..";
import agent from "../api/agent";
import { User, UserFormValues } from "../models/user";
import { store } from "./store";

export default class UserStore {
    user: User | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    get isLoggedIn() {
        return !!this.user;
    }

    login = async (creds: UserFormValues) => {
        try {
            const user = await agent.Account.login(creds);
            store.commonStore.setToken(user.token);
            runInAction(() => { this.user = user; })
            history.push('/activities');
            store.modalStore.closeModal();
        } catch (error) {
            throw error;
        }
    }

    logout = () => {
        store.commonStore.setToken(null);
        window.localStorage.removeItem('jwt');
        this.user = null;
        history.push('/');
    }

    getUser = async () => {
        try {
            const user = await agent.Account.current();
            runInAction(() => this.user = user);
        } catch (error) {
            console.log(error);
        }
    }

    register = async (creds: UserFormValues) => {
        try {
            const user = await agent.Account.register(creds);
            store.commonStore.setToken(user.token);
            runInAction(() => { this.user = user; })
            history.push('/activities');
            store.modalStore.closeModal();
        } catch (error) {
            throw error;
        }
    }

    setImage = (image: string) => {
        if (this.user) this.user.image = image;
    }
}
```

Finalmente se modifica el componente `ProfilePhotos`, donde se creará la nueva función para cargar una foto.

```tsx
import { observer } from 'mobx-react-lite';
import React, { useState } from 'react';
import { Button, Card, Grid, Header, Image } from 'semantic-ui-react';
import PhotoUploadWidget from '../../app/common/imageUpload/PhotoUploadWidget';
import { Profile } from '../../app/models/profile';
import { useStore } from '../../app/stores/store';

interface Props {
    profile: Profile
}

export default observer(function ProfilePhotos({ profile }: Props) {
    const { profileStore: { isCurrentUser, uploadPhoto, uploading } } = useStore();
    const [addPhotoMode, setAddPhotoMode] = useState(false);

    function handlePhotoUpload(file: Blob) {
        uploadPhoto(file).then(() => setAddPhotoMode(false));
    }

    return (
        <Grid>
            <Grid.Column width={16}>
                <Header floated='left' icon='image' content='Photos' />
                {isCurrentUser && (
                    <Button floated='right' basic
                        content={addPhotoMode ? 'Cancel' : 'Add Photo'}
                        onClick={() => setAddPhotoMode(!addPhotoMode)}
                    />
                )}
            </Grid.Column>
            <Grid.Column width={16}>
                {addPhotoMode ? (
                    <PhotoUploadWidget uploadPhoto={handlePhotoUpload} loading={uploading} />
                ) : (
                    <Card.Group itemsPerRow={5}>
                        {profile.photos?.map(photo => (
                            <Card key={photo.id}>
                                <Image src={photo.url} />
                            </Card>
                        ))}
                    </Card.Group>
                )}
            </Grid.Column>
        </Grid>
    )
})
```

```tsx
import React, { useEffect, useState } from 'react';
import { Cropper } from 'react-cropper';
import { Button, Grid, Header } from 'semantic-ui-react';
import PhotoWidgetCropper from './PhotoWidgetCropper';
import PhotoWidgetDropzone from './PhotoWidgetDropzone';

interface Props {
    uploadPhoto: (file: Blob) => void;
    loading: boolean;
}

export default function PhotoUploadWidget({uploadPhoto, loading}: Props) {
    const [files, setFiles] = useState<any>([]);
    const [cropper, setCropper] = useState<Cropper>();

    function onCrop() {
        if (cropper) {
            cropper.getCroppedCanvas().toBlob(blob => uploadPhoto(blob!))
        }
    }

    // se limpia la memoria utilizada en dropzone
    useEffect(() => {
        return () => {
            files.forEach((file: any) => URL.revokeObjectURL(file.preview))
        }
    }, [files])

    return (
        <Grid>
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 1 - Add Photo' />
                <PhotoWidgetDropzone setFiles={setFiles} />
            </Grid.Column>
            <Grid.Column width={1} />
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 2 - Resize image' />
                {files && files.length > 0 && (
                    <PhotoWidgetCropper setCropper={setCropper} imagePreview={files[0].preview} />
                )}
            </Grid.Column>
            <Grid.Column width={1} />
            <Grid.Column width={4}>
                <Header sub color='teal' content='Step 3 - Preview & Upload' />
                {files && files.length > 0 &&
                <>
                    <div className='img-preview' style={{ minHeight: 200, overflow: 'hidden' }} />
                    <Button.Group widths={2}>
                        <Button loading={loading} onClick={onCrop} positive icon='check' />
                        <Button disabled={loading} onClick={() => setFiles([])} icon='close' />
                    </Button.Group>
                </>}
            </Grid.Column>
        </Grid>
    )
}
```

##### 204 Configurar la foto principal

 Se añade la funcionalidad a `agent`.

```tsx
const Profiles = {
    get: (username: string) => requests.get<Profile>(`/profiles/${username}`),
    uploadPhoto: (file: Blob) => {
        let formData = new FormData();
        formData.append('File', file);
        return axios.post<Photo>('photos', formData, {
            headers: {'Content-type': 'multipart/form-data'}
        })
    },
    setMainPhoto: (id: string) => requests.post(`/photos(${id}/setmain)`, {}),
    deletePhoto: (id: string) => requests.del(`/photos/${id}`)
}
```

Se añade la funcionalidad a `profileStore`.

```tsx
setMainPhoto = async (photo: Photo) => {
    this.loading = true;
    try {
        await agent.Profiles.setMainPhoto(photo.id);
        store.userStore.setImage(photo.url);
        runInAction(() => {
            if (this.profile && this.profile.photos) {
                this.profile.photos.find(p => p.isMain)!.isMain = false;
                this.profile.photos.find(p => p.id === photo.id)!.isMain = true;
                this.profile.image = photo.url;
            }
            this.loading = false;
        })
    } catch (error) {
        console.log(error);
        runInAction(() => this.loading = false);
    }
}
```

Se adapta `ProfilePhotos`.

```tsx
import { observer } from 'mobx-react-lite';
import React, { SyntheticEvent, useState } from 'react';
import { Button, Card, Grid, Header, Image } from 'semantic-ui-react';
import PhotoUploadWidget from '../../app/common/imageUpload/PhotoUploadWidget';
import { Photo, Profile } from '../../app/models/profile';
import { useStore } from '../../app/stores/store';

interface Props {
    profile: Profile
}

export default observer(function ProfilePhotos({ profile }: Props) {
    const { profileStore: { isCurrentUser, uploadPhoto, uploading,
            loading, setMainPhoto } } = useStore();
    const [addPhotoMode, setAddPhotoMode] = useState(false);
    const [target, setTarget] = useState('');

    function handlePhotoUpload(file: Blob) {
        uploadPhoto(file).then(() => setAddPhotoMode(false));
    }

    function handleSetMainPhoto(photo: Photo, e: SyntheticEvent<HTMLButtonElement>) {
        setTarget(e.currentTarget.name);
        setMainPhoto(photo);
    }

    return (
        <Grid>
            <Grid.Column width={16}>
                <Header floated='left' icon='image' content='Photos' />
                {isCurrentUser && (
                    <Button floated='right' basic
                        content={addPhotoMode ? 'Cancel' : 'Add Photo'}
                        onClick={() => setAddPhotoMode(!addPhotoMode)}
                    />
                )}
            </Grid.Column>
            <Grid.Column width={16}>
                {addPhotoMode ? (
                    <PhotoUploadWidget uploadPhoto={handlePhotoUpload} loading={uploading} />
                ) : (
                    <Card.Group itemsPerRow={5}>
                        {profile.photos?.map(photo => (
                            <Card key={photo.id}>
                                <Image src={photo.url} />
                                {isCurrentUser && (
                                    <Button.Group fluid widths={2}>
                                        <Button
                                            basic
                                            color='green'
                                            content='Main'
                                            name={photo.id}
                                            disabled={photo.isMain}
                                            loading={target === photo.id && loading}
                                            onClick={e => handleSetMainPhoto(photo, e)}
                                        />
                                        <Button basic color='red' icon='trash' />
                                    </Button.Group>
                                )}
                            </Card>
                        ))}
                    </Card.Group>
                )}
            </Grid.Column>
        </Grid>
    )
})
```

##### 205 Borrar fotos

En `agent` ya tenemos la funcionalidad se borrar una foto.

Se define la funcionalidad en `profileStore`.

```tsx
// no se permite eliminar la foto principal
deletePhoto = async (photo: Photo) => {
    this.loading = true;
    try {
        await agent.Profiles.deletePhoto(photo.id);
        runInAction(() => {
            if (this.profile) {
                this.profile.photos = this.profile.photos!.filter(p => p.id !== photo.id);
            }
            this.loading = false;
        })
    } catch (error) {
        console.log(error);
        runInAction(() => this.loading = false);           
    }
}
```

Se ajusta `ProfilePhotos`.

```tsx
import { observer } from 'mobx-react-lite';
import React, { SyntheticEvent, useState } from 'react';
import { Button, Card, Grid, Header, Image } from 'semantic-ui-react';
import PhotoUploadWidget from '../../app/common/imageUpload/PhotoUploadWidget';
import { Photo, Profile } from '../../app/models/profile';
import { useStore } from '../../app/stores/store';

interface Props {
    profile: Profile
}

export default observer(function ProfilePhotos({ profile }: Props) {
    const { profileStore: { isCurrentUser, uploadPhoto, uploading,
            loading, setMainPhoto, deletePhoto } } = useStore();
    const [addPhotoMode, setAddPhotoMode] = useState(false);
    const [target, setTarget] = useState('');

    function handlePhotoUpload(file: Blob) {
        uploadPhoto(file).then(() => setAddPhotoMode(false));
    }

    function handleSetMainPhoto(photo: Photo, e: SyntheticEvent<HTMLButtonElement>) {
        setTarget(e.currentTarget.name);
        setMainPhoto(photo);
    }

    function handleDeletePhoto(photo: Photo, e: SyntheticEvent<HTMLButtonElement>) {
        setTarget(e.currentTarget.name);
        deletePhoto(photo);
    }
    return (
        <Grid>
            <Grid.Column width={16}>
                <Header floated='left' icon='image' content='Photos' />
                {isCurrentUser && (
                    <Button floated='right' basic
                        content={addPhotoMode ? 'Cancel' : 'Add Photo'}
                        onClick={() => setAddPhotoMode(!addPhotoMode)}
                    />
                )}
            </Grid.Column>
            <Grid.Column width={16}>
                {addPhotoMode ? (
                    <PhotoUploadWidget uploadPhoto={handlePhotoUpload} loading={uploading} />
                ) : (
                    <Card.Group itemsPerRow={5}>
                        {profile.photos?.map(photo => (
                            <Card key={photo.id}>
                                <Image src={photo.url} />
                                {isCurrentUser && (
                                    <Button.Group fluid widths={2}>
                                        <Button
                                            basic
                                            color='green'
                                            content='Main'
                                            name={'main' + photo.id}
                                            disabled={photo.isMain}
                                            loading={target === 'main' + photo.id && loading}
                                            onClick={e => handleSetMainPhoto(photo, e)}
                                        />
                                        <Button
                                            basic
                                            color='red'
                                            icon='trash'
                                            name={photo.id}
                                            disabled={photo.isMain}
                                            loading={target === photo.id && loading}
                                            onClick={e => handleDeletePhoto(photo, e)}
                                        />
                                    </Button.Group>
                                )}
                            </Card>
                        ))}
                    </Card.Group>
                )}
            </Grid.Column>
        </Grid>
    )
})
```

##### 206 Sumario de la sección 17



