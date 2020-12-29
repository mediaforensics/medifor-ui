#!/usr/bin/env python3

"""The watchdog command runs in the background, watching docker-compose ps for failed containers.

Restarts containers as needed.
"""

import os.path
import re
import subprocess
import time


class ComposeClient:
    def __init__(self, workdir=None, ymlname=None):
        self.ymlname = ymlname
        self.workdir = workdir or '.'

        self.compose_cmd = ['docker-compose']
        if ymlname:
            self.compose_cmd.extend(['-f', ymlname])

    def cmd(self, args):
        if isinstance(args, str):
            args = [args]
        return self.compose_cmd + list(args)

    def _filter_exit_lines(self, lines):
        """Get exited container information.
        >>> list(ComposeClient()._filter_exit_lines(['foo Exit 1', 'bar blah blah', 'baz Exit 138']))
        [('foo', 1), ('baz', 138)]
        """
        for line in lines:
            ## NOTE: line was being passed as byte object, so wrapped in str() below
            m = re.search(r'\sExit\s+(\d+)', str(line))
            if m:
                pieces = line.split()
                yield (pieces[0], int(m.group(1)))

    def ps_exited(self):
        out = subprocess.check_output(self.cmd('ps'), cwd=self.workdir)
        return self._filter_exit_lines(out.splitlines()[2:])

    def up(self, *container_id):
        for id in container_id:
            print(subprocess.check_output(['docker', 'start', id]))

def main():
    cli = ComposeClient('.')

    while True:
        for id, code in cli.ps_exited():
            print("ID %s exited with code %d: restarting", id, code)
            cli.up(id)
        time.sleep(15)


if __name__ == "__main__":
    main()
