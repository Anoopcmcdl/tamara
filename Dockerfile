FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Enable Corepack package manager
RUN corepack enable

ARG SECRET_KEY
ARG APL
ARG SALEOR_APP_TOKEN
ARG SALEOR_APP_ID
ARG SALEOR_API_URL
ENV SECRET_KEY=${SECRET_KEY}
ENV APL=${APL}
ENV SALEOR_APP_TOKEN=${SALEOR_APP_TOKEN}
ENV SALEOR_APP_ID=${SALEOR_APP_ID}
ENV SALEOR_API_URL=${SALEOR_API_URL}

# Set the working directory in the container
WORKDIR /app


# Copy the entire "apps" directory to the container
COPY . /app


# Install project dependencies using pnpm
RUN pnpm install

# Build the Next.js application (if necessary)
RUN pnpm build

# Expose the port your application will run on (Next.js apps often use 3000)
EXPOSE 3001

# RUN chmod 777 /app/
# RUN chown -R mozcomuser:mozcomgroup 

# USER mozcomuser

# Define the command to start your application
CMD ["pnpm", "start"]