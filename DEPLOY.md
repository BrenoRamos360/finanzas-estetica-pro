# Guía de Despliegue (Deployment)

Para compartir tu aplicación con tu amigo y que él pueda usarla desde su dispositivo, necesitas ponerla en internet. La forma más fácil y gratuita es usar **Vercel**.

## Opción 1: Arrastrar y Soltar (Más fácil)

1.  Ve a [vercel.com](https://vercel.com) y crea una cuenta (puedes usar tu GitHub, Google, etc.).
2.  Instala `Node.js` en tu computadora si no lo tienes.
3.  En tu terminal (dentro de la carpeta del proyecto), ejecuta este comando para crear la versión optimizada:
    ```bash
    npm run build
    ```
    Esto creará una carpeta llamada `dist`.
4.  En el panel de Vercel, busca el botón "Add New Project" -> "Project".
5.  Si tienes el código en GitHub, impórtalo desde ahí. Si no, puedes instalar "Vercel CLI" o usar la opción de subir carpeta si está disponible (generalmente es mejor conectar con GitHub).

## Opción 2: Usando GitHub (Recomendada)

1.  Sube este proyecto a un repositorio en tu cuenta de GitHub.
2.  Ve a [vercel.com](https://vercel.com) y conecta tu cuenta de GitHub.
3.  Haz clic en "Add New Project" e importa el repositorio que acabas de subir.
4.  Vercel detectará automáticamente que es un proyecto Vite/React.
5.  Haz clic en "Deploy".
6.  ¡Listo! Vercel te dará un **link** (ejemplo: `finanzas-estetica.vercel.app`) que puedes enviar a tu amigo.

## Notas Importantes

*   **Datos**: Como esta aplicación guarda los datos en el navegador (LocalStorage), tu amigo tendrá sus propios datos en su teléfono/computadora y tú tendrás los tuyos en los tuyos. Nadie verá los datos del otro.
*   **Cuentas**: Tu amigo podrá crear su propio usuario y contraseña (que se guardan en SU navegador).
