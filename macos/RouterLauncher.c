#include <libgen.h>
#include <mach-o/dyld.h>
#include <errno.h>
#include <fcntl.h>
#include <limits.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/wait.h>
#include <unistd.h>

static volatile sig_atomic_t child_process = -1;

static void forward_signal(int signal_number) {
    if (child_process > 0) kill((pid_t)child_process, signal_number);
}

int main(int argc, char **argv) {
    char executable[PATH_MAX];
    uint32_t size = sizeof(executable);
    if (_NSGetExecutablePath(executable, &size) != 0) {
        fputs("Codex Micro Router could not resolve its app path.\n", stderr);
        return 2;
    }

    char resolved[PATH_MAX];
    if (realpath(executable, resolved) == NULL) {
        perror("realpath");
        return 2;
    }

    char root[PATH_MAX];
    snprintf(root, sizeof(root), "%s", resolved);
    for (int i = 0; i < 5; i++) {
        char *parent = dirname(root);
        if (parent != root) memmove(root, parent, strlen(parent) + 1);
    }

    char cli[PATH_MAX];
    snprintf(cli, sizeof(cli), "%s/src/cli.js", root);
    const char *command = argc > 1 ? argv[1] : getenv("MICRO_ROUTER_COMMAND");
    if (command == NULL || command[0] == '\0') command = "status";

    pid_t child = fork();
    if (child < 0) {
        perror("fork");
        return 1;
    }
    if (child == 0) {
        if (chdir(root) != 0) {
            perror("chdir");
            _exit(2);
        }
        char logfile[PATH_MAX];
        snprintf(logfile, sizeof(logfile), "%s/runtime/router.log", root);
        int log_fd = open(logfile, O_WRONLY | O_CREAT | O_APPEND, 0644);
        if (log_fd >= 0) {
            dup2(log_fd, STDOUT_FILENO);
            dup2(log_fd, STDERR_FILENO);
            close(log_fd);
        }
        execl("/usr/local/bin/node", "node", cli, command, (char *)NULL);
        perror("execl");
        _exit(1);
    }

    child_process = child;
    signal(SIGINT, forward_signal);
    signal(SIGTERM, forward_signal);

    char pidfile[PATH_MAX];
    snprintf(pidfile, sizeof(pidfile), "%s/runtime/router.pid", root);
    FILE *pid_stream = fopen(pidfile, "w");
    if (pid_stream != NULL) {
        fprintf(pid_stream, "%d\n", child);
        fclose(pid_stream);
    }

    int status = 0;
    pid_t waited;
    do {
        waited = waitpid(child, &status, 0);
    } while (waited < 0 && errno == EINTR);
    if (waited < 0) {
        perror("waitpid");
        unlink(pidfile);
        return 1;
    }
    unlink(pidfile);
    return WIFEXITED(status) ? WEXITSTATUS(status) : 1;
}
