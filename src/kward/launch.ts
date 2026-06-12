export type KwardLaunchCommand = {
  command: string;
  args: string[];
  cwd: string;
};

export function resolveKwardLaunch(cwd: string): KwardLaunchCommand {
  return {
    command: 'bundle',
    args: ['exec', 'ruby', 'lib/main.rb', 'rpc'],
    cwd
  };
}
