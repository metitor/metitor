import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getAvailablePlugins, getPluginManifest } from "@/lib/plugin-system/store";

// Initialize plugins on module load
import "@/lib/plugin-system/init";

const prisma = new PrismaClient();

/**
 * GET /api/plugins - Get available plugins and user's installations
 */
export async function GET() {
  try {
    // Get current user session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Get all available plugins
    const availablePlugins = getAvailablePlugins();

    // If logged in, get user's installations
    let installations: any[] = [];
    if (session?.user?.id) {
      installations = await prisma.pluginInstallation.findMany({
        where: { userId: session.user.id },
      });
    }

    // Map installations to plugin IDs
    const installationMap = new Map(
      installations.map((i) => [i.pluginId, i])
    );

    // Combine available plugins with installation status
    const plugins = availablePlugins.map((manifest) => ({
      ...manifest,
      installed: installationMap.has(manifest.id),
      enabled: installationMap.get(manifest.id)?.enabled ?? false,
      settings: installationMap.get(manifest.id)?.settings ?? {},
    }));

    return NextResponse.json({
      plugins,
      isAuthenticated: !!session?.user,
    });
  } catch (error) {
    console.error("Error fetching plugins:", error);
    return NextResponse.json(
      { error: "Failed to fetch plugins" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/plugins - Install a plugin
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pluginId } = body;

    if (!pluginId) {
      return NextResponse.json(
        { error: "Plugin ID is required" },
        { status: 400 }
      );
    }

    // Verify plugin exists
    const manifest = getPluginManifest(pluginId);
    if (!manifest) {
      return NextResponse.json(
        { error: "Plugin not found" },
        { status: 404 }
      );
    }

    // Create or update installation
    const installation = await prisma.pluginInstallation.upsert({
      where: {
        userId_pluginId: {
          userId: session.user.id,
          pluginId,
        },
      },
      create: {
        userId: session.user.id,
        pluginId,
        enabled: true,
      },
      update: {
        enabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      installation,
      manifest,
    });
  } catch (error) {
    console.error("Error installing plugin:", error);
    return NextResponse.json(
      { error: "Failed to install plugin" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/plugins - Update plugin settings or enable/disable
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { pluginId, enabled, settings } = body;

    if (!pluginId) {
      return NextResponse.json(
        { error: "Plugin ID is required" },
        { status: 400 }
      );
    }

    // Check if plugin is installed
    const existing = await prisma.pluginInstallation.findUnique({
      where: {
        userId_pluginId: {
          userId: session.user.id,
          pluginId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Plugin not installed" },
        { status: 404 }
      );
    }

    // Update installation
    const installation = await prisma.pluginInstallation.update({
      where: {
        userId_pluginId: {
          userId: session.user.id,
          pluginId,
        },
      },
      data: {
        ...(enabled !== undefined && { enabled }),
        ...(settings !== undefined && { settings }),
      },
    });

    return NextResponse.json({
      success: true,
      installation,
    });
  } catch (error) {
    console.error("Error updating plugin:", error);
    return NextResponse.json(
      { error: "Failed to update plugin" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/plugins - Uninstall a plugin
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pluginId = searchParams.get("pluginId");

    if (!pluginId) {
      return NextResponse.json(
        { error: "Plugin ID is required" },
        { status: 400 }
      );
    }

    // Delete installation
    await prisma.pluginInstallation.delete({
      where: {
        userId_pluginId: {
          userId: session.user.id,
          pluginId,
        },
      },
    });

    // Also delete any entity-specific configs for this plugin
    await prisma.entityPluginConfig.deleteMany({
      where: {
        userId: session.user.id,
        pluginId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error uninstalling plugin:", error);
    return NextResponse.json(
      { error: "Failed to uninstall plugin" },
      { status: 500 }
    );
  }
}
