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

Incluye 210 archivos, muchos de los cuales no interesan porque se regeneran automáticamente. Con la plantilla `gitignore` pasamos a 27.